import {BehaviorSubject, from, Observable} from 'rxjs';
import {SignalConnection} from './signal.connection';
import {SignalMessage} from './models/webrtc-signal-message.model';
import {filter, flatMap, mapTo} from 'rxjs/operators';

export class VideoConnection {
    remoteStream$: Observable<MediaStream>;

    private pc: RTCPeerConnection;
    private remoteStreamSubj: BehaviorSubject<MediaStream>;

    private localVideoTrack: MediaStreamTrack;
    private localAudioTrack: MediaStreamTrack;
    private videoSender: RTCRtpSender;
    private audioSender: RTCRtpSender;

    constructor(private localStream: MediaStream, private signalSocket: SignalConnection) {
        this.localVideoTrack = localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0] || null;
        this.localAudioTrack = localStream.getAudioTracks().length > 0 && localStream.getAudioTracks()[0] || null;

        this.remoteStreamSubj = new BehaviorSubject(null);
        this.remoteStream$ = this.remoteStreamSubj.asObservable().pipe(filter(v => v !== null));

        this.log('Creating new RTC connection');
        this.pc = new RTCPeerConnection(rtcConfig);

        if (this.localVideoTrack) {
            this.log('Adding local video track to RTC connection');
            this.videoSender = this.pc.addTrack(this.localVideoTrack, localStream);
        }

        if (this.localAudioTrack) {
            this.log('Adding local audio track to RTC connection');
            this.audioSender = this.pc.addTrack(this.localAudioTrack, localStream);
        }

        signalSocket.opened$.subscribe(() => this.init())
    }

    get remoteStream() {
        return this.remoteStreamSubj.value;
    }

    init() {
        this.log('Listening to `track` event');
        this.pc.addEventListener('track', (evt: RTCTrackEvent) => {
            let remoteStream = evt.streams[0];
            this.log('Remote track added', evt.track.label);
            if (this.remoteStreamSubj.value !== remoteStream) {
                this.log('Got a remote stream', remoteStream);
                this.remoteStreamSubj.next(remoteStream);
            }
        });

        this.log('Listening to `icecandidate` event');
        this.pc.addEventListener('icecandidate', (evt: RTCPeerConnectionIceEvent) => {
            if (evt.candidate) {
                this.log('ICE generated a local candidate. Sending it.');
                this.signalSocket.sendCandidate(evt.candidate);
            }
        });

        this.pc.addEventListener('icegatheringstatechange', (evt: Event) => {
            this.log('Gathering of candidated state: ' + this.pc.iceGatheringState);
        });

        this.pc.addEventListener('connectionstatechange', (evt: Event) => {
            this.log('RTC connection state: ' + this.pc.connectionState);
        });

        this.pc.addEventListener('iceconnectionstatechange', (evt: Event) => {
            this.log('ICE connection state: ' + this.pc.iceConnectionState);
        });

        /* not needed because we won't create offer */
        // this.log('Listening to negotiationneeded event');
        // this.pc.addEventListener('negotiationneeded', () => {
        //     this.log('Negotiation needed. Doing nothing.');
        // });

        this.log('Waiting for remote candidates');
        this.signalSocket.candidate$.subscribe(msg => {
            this.log('Got a remote candidate');
            // this.log('Remote desc:', this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type);

            let candidate: RTCIceCandidate = new RTCIceCandidate(JSON.parse(msg.sdp));
            this.pc.addIceCandidate(candidate)
                .then(() => this.log('Remote candidate added successfully'))
                .catch(err => this.log('Error while processing a remote candidate', err));

            // todo observable - копилка кандидатов, которая открывается, когда соединение готово (обработан офер)
            // todo не забыть добавить и те, что пришли после готовности офера
            // предусмотрим случай, когда кандидаты пришли до того, как соединение готово их добавить
            // if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
        });

        this.log('Waiting for offer');
        this.signalSocket.offer$.pipe(
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
                this.signalSocket.sendAnswer(desc.sdp);
            },
        );
    }

    close() {
        if (this.pc) {
            this.pc.close();
            this.pc = undefined;
        }
        this.remoteStreamSubj.complete();
    }

    private log(...messages) {
        let text = messages.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg).join(' ');
        console.log(`%c[V-CONNECTION] ${text}`, 'color: #f4b');
    }

}

const rtcConfig = {
    iceTransportPolicy: <RTCIceTransportPolicy>'relay',
    iceServers:
        [
            {
                urls: 'turn:194.87.190.85:3478',
                username: 'mls',
                credential: 'Password1'
            }
        ]
};