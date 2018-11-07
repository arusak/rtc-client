import {BehaviorSubject, from, fromEvent, merge, Observable, Subject} from 'rxjs';
import {SignalConnection} from './signal.connection';
import {SignalMessage} from './models/webrtc-signal-message.model';
import {buffer, filter, flatMap, mapTo, tap} from 'rxjs/operators';
import {skipUntil, take} from 'rxjs/internal/operators';
import {ConfigService} from './config.service';
import {ChatConnection} from './chat.connection';

export class VideoConnection {
    remoteStream$: Observable<MediaStream>;
    localStream$: Observable<MediaStream>;
    terminated$: Observable<any>;
    connected$: Observable<any>;

    private localStreamSubj: BehaviorSubject<MediaStream>;
    private remoteStreamSubj: BehaviorSubject<MediaStream>;
    private terminatedSubj: Subject<any>;
    private connectedSubj: Subject<any>;

    private pc: RTCPeerConnection;
    private signalConnection: SignalConnection;

    private localVideoTrack: MediaStreamTrack;
    private localAudioTrack: MediaStreamTrack;
    private videoSender: RTCRtpSender;
    private audioSender: RTCRtpSender;

    constructor(private chatConnection: ChatConnection, private signalSocketId: string, private config: ConfigService) {
        this.localStreamSubj = new BehaviorSubject(null);
        this.localStream$ = this.localStreamSubj.pipe(filter(v => v !== null));

        this.remoteStreamSubj = new BehaviorSubject(null);
        this.remoteStream$ = this.remoteStreamSubj.pipe(filter(v => v !== null));

        this.connectedSubj = new Subject();
        this.connected$ = this.connectedSubj.asObservable();

        this.terminatedSubj = new Subject();
        this.terminated$ = this.terminatedSubj.asObservable();
    }

    call() {
        this.initializeConnection(() => {
            this.log('Sending call to signal socket');
            this.signalConnection.call();
        });
    }

    cancel() {
        this.signalConnection.hangup();
    }

    accept() {
        this.initializeConnection();
    }

    decline() {
        this.log('Opening signal connection');
        let signalConnection = new SignalConnection(this.signalSocketId);
        signalConnection.opened$.subscribe(() => {
            this.log('Hanging up signal connection');
            signalConnection.hangup();
            signalConnection.close();
            this.terminatedSubj.next();
        });
    }

    hangup() {
        this.signalConnection.hangup();
    }

    /**
     * Получить доступ к медиа-устройствам, создать соединение с сигнальным каналом и каналом данных
     * @param onLocalStream колбек на получение локального медиапотока
     */
    private initializeConnection(onLocalStream?: () => void) {
        this.watchChatForEndMessage();
        this.initializeSignalConnection()
            .then(() => this.startLocalStream())
            .then(() => {
                if (typeof onLocalStream === 'function') {
                    onLocalStream();
                }

                this.createRtcConnectionAndSetupDataFlow();
            });
    }

    private startLocalStream(): Promise<MediaStream> {
        this.log('Requesting access to devices');
        return navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .catch(err => {
                this.log('Error accessing devices.', err);
            })
            .then((localStream: MediaStream) => {
                this.localVideoTrack = localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0] || null;
                this.localAudioTrack = localStream.getAudioTracks().length > 0 && localStream.getAudioTracks()[0] || null;
                this.localStreamSubj.next(localStream);
                return localStream;
            });
    }

    // When video call ends, close everything
    private watchChatForEndMessage() {
        merge(this.chatConnection.ended$, this.chatConnection.error$)
            .pipe(take(1))
            .subscribe(() => {
                this.log('Closing connections');
                this.signalConnection.close();
                this.closeRtcConnectionAndCleanup();
                this.terminatedSubj.next();
            });
    }

    private initializeSignalConnection(): Promise<any> {
        this.log('Initializing a signal socket');
        this.signalConnection = new SignalConnection(this.signalSocketId);

        // при открытии сигнального сокета сигнализируем об успешном подключении
        // и подписываемся на сообщения об ошибках
        this.signalConnection.opened$
            .pipe(
                tap(() => this.connectedSubj.next()),
                flatMap(() => this.signalConnection.error$),
            )
            .subscribe(console.error);

        return this.signalConnection.opened$.toPromise();
    }

    private createRtcConnectionAndSetupDataFlow() {
        this.log('Creating new RTC connection');
        this.pc = new RTCPeerConnection(this.config.rtcConfig);

        this.setupRtcStateLogging();
        this.setupSendingOfLocalCandidates();
        this.setupListeningForRemoteCandidates();
        this.setupListeningForRemoteStream();
        this.setupSdpExchange();

        this.addLocalTracksToRtcPeerConnection();
    }


    private closeRtcConnectionAndCleanup() {
        if (this.pc) {
            this.pc.close();
            this.pc = undefined;
        }

        this.localStreamSubj.next(null);
        this.remoteStreamSubj.next(null);

        this.localVideoTrack = null;
        this.localAudioTrack = null;
        this.videoSender = null;
        this.audioSender = null;
    }

    private addLocalTracksToRtcPeerConnection() {
        if (this.localVideoTrack) {
            this.log('Adding local video track to RTC connection');
            this.videoSender = this.pc.addTrack(this.localVideoTrack, this.localStreamSubj.value);
        }

        if (this.localAudioTrack) {
            this.log('Adding local audio track to RTC connection');
            this.audioSender = this.pc.addTrack(this.localAudioTrack, this.localStreamSubj.value);
        }
    }

    private setupListeningForRemoteStream() {
        this.log('Listening to `track` event');
        this.pc.addEventListener('track', (evt: RTCTrackEvent) => {
            let remoteStream = evt.streams[0];
            this.log('Remote track added', evt.track.label);
            if (this.remoteStreamSubj.value !== remoteStream) {
                this.log('Got a remote stream', remoteStream);
                this.remoteStreamSubj.next(remoteStream);
            }
        });
    }

    private setupListeningForRemoteCandidates() {
        this.log('Waiting for remote candidates');

        // watching for peerConnection to get ready for candidates
        let release$ = fromEvent(this.pc, 'signalingstatechange')
            .pipe(filter(() => this.pc.signalingState === 'have-remote-offer'), take(1));

        // until peerConnection is ready, buffer incoming candidates
        merge(
            this.signalConnection.candidate$.pipe(buffer(release$), flatMap((buffer: SignalMessage[]) => from(buffer))),
            this.signalConnection.candidate$.pipe(skipUntil(release$))
        ).subscribe((msg: SignalMessage) => {
            this.log('Got a remote candidate');

            let candidate: RTCIceCandidate;
            try {
                candidate = new RTCIceCandidate(JSON.parse(msg.sdp));
            } catch (err) {
                this.log('Error ICE candidate from SDP');
            }

            if (candidate) {
                this.pc.addIceCandidate(candidate)
                    .then(() => this.log('Remote candidate added successfully'))
                    .catch(err => this.log('Error while processing a remote candidate', err));
            }
        });
    }

    private setupSendingOfLocalCandidates() {
        this.log('Listening to `icecandidate` event');
        this.pc.addEventListener('icecandidate', (evt: RTCPeerConnectionIceEvent) => {
            if (evt.candidate) {
                this.log('ICE generated a local candidate. Sending it.');
                this.signalConnection.sendCandidate(evt.candidate);
            }
        });
    }

    private setupSdpExchange() {
        this.log('Waiting for offer');
        this.signalConnection.offer$.pipe(
            flatMap((msg: SignalMessage) => {
                this.log('Got offer. Setting remote description');
                let remoteDescription = new RTCSessionDescription({type: 'offer', sdp: msg.sdp});
                return from(this.pc.setRemoteDescription(remoteDescription).catch(err => console.error('Error while setting remote description', err)))
                    .pipe(mapTo(remoteDescription));
            }),

            flatMap((remoteDesc: RTCSessionDescription) => {
                this.log('Creating answer');
                return this.pc.createAnswer(<RTCAnswerOptions>remoteDesc).catch(err => console.error('Error while creating answer', err))
            }),

            flatMap((localDesc: RTCSessionDescription) => {
                this.log('Setting local description');
                return from(this.pc.setLocalDescription(localDesc).catch(err => console.error('Error while setting local description', err)))
                    .pipe(mapTo(localDesc));
            })
        ).subscribe((desc: RTCSessionDescription) => {
                this.log('Sending answer');
                this.signalConnection.sendAnswer(desc.sdp);
            },
        );
    }

    private setupRtcStateLogging() {
        this.pc.addEventListener('icegatheringstatechange', () => {
            this.log('Gathering of candidates: ' + (this.pc && this.pc.iceGatheringState));
        });

        this.pc.addEventListener('iceconnectionstatechange', () => {
            this.log('ICE connection state: ' + (this.pc && this.pc.iceConnectionState));
        });

        // somehow addEventListener doesn't work in Chrome
        this.pc.onsignalingstatechange = () => this.log('Signaling state: ' + (this.pc && this.pc.signalingState));

        this.pc.addEventListener('negotiationneeded', () => {
            this.log('Negotiation needed. Doing nothing.');
        });
    }

    private log(...messages) {
        let text = messages.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg).join(' ');
        console.log(`%c[V-CONNECTION] ${text}`, 'color: #f4b');
    }
}
