import {BehaviorSubject, from, Observable} from 'rxjs';
import {SignalConnection} from './signal.connection';
import {SignalMessage} from './webrtc-signal-message.model';
import {filter, flatMap, mapTo} from 'rxjs/operators';

export class VideoConnection {
    remoteStream$: Observable<MediaStream>;

    private pc: RTCPeerConnection;
    private remoteStreamSubj: BehaviorSubject<MediaStream>;

    constructor(private localStream: MediaStream, private signalSocket: SignalConnection) {
        this.remoteStreamSubj = new BehaviorSubject(null);
        this.remoteStream$ = this.remoteStreamSubj.asObservable().pipe(filter(v => v !== null));
        console.log('Creating new RTC connection');
        this.pc = new RTCPeerConnection(rtcConfig);
        this.pc.addStream(this.localStream);

        this.init();
    }

    get remoteStream() {
        return this.remoteStreamSubj.value;
    }

    init() {
        // todo addstream is depecated, use `track` event
        console.log('Listening to `addstream` event');
        this.pc.addEventListener('addstream', (evt: MediaStreamEvent) => {
            console.log('Got a remote stream', evt.stream.getVideoTracks());
            this.remoteStreamSubj.next(evt.stream);
        });

        console.log('Listening to `icecandidate` event');
        this.pc.addEventListener('icecandidate', (evt: RTCPeerConnectionIceEvent) => {
            if (evt.candidate) {
                console.log('STUN generated a local candidate. Sending it.');
                this.signalSocket.sendCandidate(evt.candidate);
            }
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
                .then(() => console.log('Remote candidate added successfully'));

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
                return from(this.pc.setRemoteDescription(remoteDescription))
                    .pipe(mapTo(remoteDescription));
            }),
            flatMap((remoteDesc: RTCSessionDescription) => {
                console.log('Creating answer');
                return this.pc.createAnswer(<RTCAnswerOptions>remoteDesc)
            }),
            flatMap((localDesc: RTCSessionDescription) => {
                console.log('Setting local description');
                return from(this.pc.setLocalDescription(localDesc))
                    .pipe(mapTo(localDesc));
            })
        ).subscribe((desc: RTCSessionDescription) => {
                console.log('Sending answer');
                this.signalSocket.sendAnswer(desc.sdp);
            },
        );
    }

    close() {
        this.pc.close();
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