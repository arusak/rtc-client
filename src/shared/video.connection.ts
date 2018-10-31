import {BehaviorSubject, from, fromEvent, merge, Observable} from 'rxjs';
import {SignalConnection} from './signal.connection';
import {SignalMessage} from './models/webrtc-signal-message.model';
import {buffer, filter, flatMap, mapTo} from 'rxjs/operators';
import {skipUntil, take} from 'rxjs/internal/operators';

export class VideoConnection {
    remoteStream$: Observable<MediaStream>;

    private pc: RTCPeerConnection;
    private remoteStreamSubj: BehaviorSubject<MediaStream>;

    private localVideoTrack: MediaStreamTrack;
    private localAudioTrack: MediaStreamTrack;
    private videoSender: RTCRtpSender;
    private audioSender: RTCRtpSender;

    constructor(private localStream: MediaStream, private signalSocket: SignalConnection, private rtcConfig: any) {
        this.localVideoTrack = localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0] || null;
        this.localAudioTrack = localStream.getAudioTracks().length > 0 && localStream.getAudioTracks()[0] || null;

        this.remoteStreamSubj = new BehaviorSubject(null);
        this.remoteStream$ = this.remoteStreamSubj.pipe(filter(v => v !== null));

        signalSocket.opened$.subscribe(() => this.open())
    }

    private open() {
        this.log('Creating new RTC connection');
        this.pc = new RTCPeerConnection(this.rtcConfig);

        this.setupStateLogging();
        this.setupSendingOfLocalCandidates();
        this.setupListeningForRemoteCandidates();
        this.setupListeningForRemoteStream();
        this.setupOfferProcessing();

        this.addLocalTracksToRtcPeerConnection();
    }

    close() {
        if (this.pc) {
            this.pc.close();
            this.pc = undefined;
        }
        this.remoteStreamSubj.complete();
        this.remoteStreamSubj = null;

        this.localStream.getTracks().forEach(t => t.stop());
        this.localStream = null;
        this.localVideoTrack = null;
        this.localAudioTrack = null;
        this.videoSender = null;
        this.audioSender = null;
    }

    private addLocalTracksToRtcPeerConnection() {
        if (this.localVideoTrack) {
            this.log('Adding local video track to RTC connection');
            this.videoSender = this.pc.addTrack(this.localVideoTrack, this.localStream);
        }

        if (this.localAudioTrack) {
            this.log('Adding local audio track to RTC connection');
            this.audioSender = this.pc.addTrack(this.localAudioTrack, this.localStream);
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
            this.signalSocket.candidate$.pipe(buffer(release$), flatMap((buffer: SignalMessage[]) => from(buffer))),
            this.signalSocket.candidate$.pipe(skipUntil(release$))
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
                this.signalSocket.sendCandidate(evt.candidate);
            }
        });
    }

    private setupOfferProcessing() {
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

    private setupStateLogging() {
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
