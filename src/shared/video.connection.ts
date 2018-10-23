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

        console.log('Creating new RTC connection');
        this.pc = new RTCPeerConnection(rtcConfig);

        if (this.localVideoTrack) {
            console.log('Adding local video track to RTC connection');
            this.videoSender = this.pc.addTrack(this.localVideoTrack, localStream);
        }

        if (this.localAudioTrack) {
            console.log('Adding local audio track to RTC connection');
            this.audioSender = this.pc.addTrack(this.localAudioTrack, localStream);
        }

        signalSocket.opened$.subscribe(() => this.init())
    }

    get remoteStream() {
        return this.remoteStreamSubj.value;
    }

    init() {
        console.log('Listening to `track` event');
        this.pc.addEventListener('track', (evt: RTCTrackEvent) => {
            let remoteStream = evt.streams[0];
            console.log('Remote track added', evt.track.label);
            if (this.remoteStreamSubj.value !== remoteStream) {
                console.log('Got a remote stream', remoteStream);
                this.remoteStreamSubj.next(remoteStream);
            }
        });

        console.log('Listening to `icecandidate` event');
        this.pc.addEventListener('icecandidate', (evt: RTCPeerConnectionIceEvent) => {
            if (evt.candidate) {
                console.log('STUN generated a local candidate. Sending it.');
                this.signalSocket.sendCandidate(evt.candidate);
            }
        });

        this.pc.addEventListener('icegatheringstatechange', (evt: Event) => {
            console.log('Gathering of candidated state: ' + this.pc.iceGatheringState);
        });

        this.pc.addEventListener('connectionstatechange', (evt: Event) => {
            console.log('RTC connection state: ' + this.pc.connectionState);
        });

        this.pc.addEventListener('iceconnectionstatechange', (evt: Event) => {
            console.log('ICE connection state: ' + this.pc.iceConnectionState);
        });

        /* not needed because we won't create offer */
        // console.log('Listening to negotiationneeded event');
        // this.pc.addEventListener('negotiationneeded', () => {
        //     console.log('Negotiation needed. Doing nothing.');
        // });

        console.log('Waiting for remote candidates');
        this.signalSocket.candidate$.subscribe(msg => {
            console.log('Got a remote candidate');
            // console.log('Remote desc:', this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type);

            let candidate: RTCIceCandidate = new RTCIceCandidate(JSON.parse(msg.sdp));
            this.pc.addIceCandidate(candidate)
                .then(() => console.log('Remote candidate added successfully'))
                .catch(err => console.log('Error while processing a remote candidate', err));

            // todo observable - копилка кандидатов, которая открывается, когда соединение готово (обработан офер)
            // todo не забыть добавить и те, что пришли после готовности офера
            // предусмотрим случай, когда кандидаты пришли до того, как соединение готово их добавить
            // if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
        });

        console.log('Waiting for offer');
        this.signalSocket.offer$.pipe(
            flatMap((msg: SignalMessage) => {
                console.log('Got offer. Setting remote description');
                let remoteDescription = new RTCSessionDescription({type: 'offer', sdp: msg.sdp});
                return from(this.pc.setRemoteDescription(remoteDescription).catch(err => console.error('Error while setting remote description', err)))
                    .pipe(mapTo(remoteDescription));
            }),
            flatMap((remoteDesc: RTCSessionDescription) => {
                console.log('Creating answer');
                return this.pc.createAnswer(<RTCAnswerOptions>remoteDesc).catch(err => console.error('Error while creating answer', err))
            }),
            flatMap((localDesc: RTCSessionDescription) => {
                console.log('Setting local description');
                return from(this.pc.setLocalDescription(localDesc).catch(err => console.error('Error while setting local description', err)))
                    .pipe(mapTo(localDesc));
            })
        ).subscribe((desc: RTCSessionDescription) => {
                console.log('Sending answer');
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