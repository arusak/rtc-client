import {interval, Observable, Subject} from "rxjs";
import {SignalMessage} from "./webrtc-signal-message.model";
import {WebSocketConnection} from "./web-socket-connection.class";
import {filter, share, takeUntil, map} from "rxjs/operators";

export class SignalConnection {
    offer$: Observable<SignalMessage>;
    candidate$: Observable<SignalMessage>;
    error$: Observable<SignalMessage>;
    hangup$: Observable<SignalMessage>;

    private socketConnection: WebSocketConnection;
    private stopPing$: Subject<any>;

    constructor(socketId: string) {
        this.socketConnection = new WebSocketConnection();
        this.socketConnection.connect(`ws/video/${socketId}`);

        let data$: Observable<SignalMessage> = this.socketConnection.data$
            .pipe(map((evt: MessageEvent) => {
                let data = JSON.parse(evt.data);
                return new SignalMessage(data);
            }), share());

        this.offer$ = data$.pipe(filter(msg => msg.type === 'offer'));
        this.candidate$ = data$.pipe(filter(msg => msg.type === 'candidate'));
        this.hangup$ = data$.pipe(filter(msg => msg.type === 'hangup'));
        this.error$ = data$.pipe(filter(msg => msg.type === 'error'));

        this.setupPing();
    }

    close() {
        this.stopPing$.next();
        this.socketConnection.close();
    }

    call() {
        this.socketConnection.send({type: 'call', domain: 'WEB'});
    }

    hangup() {
        this.socketConnection.send({type: 'hangup'});
    }

    sendCandidate(candidate: RTCIceCandidate) {
        this.socketConnection.send({type: 'candidate', sdp: JSON.stringify(candidate)});
    }

    sendAnswer(sdp: string) {
        this.socketConnection.send({type: 'answer', sdp});
    }

    private setupPing() {
        this.stopPing$ = new Subject();

        interval(10000)
            .pipe(takeUntil(this.stopPing$))
            .subscribe(() => this.socketConnection.send({type: 'ping'}));
    }
}
