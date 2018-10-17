import {from, interval, Observable, Subject} from 'rxjs';
import {SignalMessage} from './webrtc-signal-message.model';
import {WebSocketConnection} from './web-socket-connection.class';
import {filter, map, share, shareReplay, takeUntil, tap} from 'rxjs/operators';

export class SignalConnection {
    offer$: Observable<SignalMessage>;
    candidate$: Observable<SignalMessage>;
    error$: Observable<SignalMessage>;
    hangup$: Observable<SignalMessage>;
    terminated$: Observable<any>;
    opened$: Observable<any>;

    private socketConnection: WebSocketConnection;
    private terminatedSubj: Subject<any>;

    constructor(socketId: string) {
        this.terminatedSubj = new Subject();
        this.terminated$ = this.terminatedSubj.asObservable();

        this.socketConnection = new WebSocketConnection();
        this.opened$ = from(this.socketConnection.connect(`video/${socketId}`))
            .pipe(
                takeUntil(this.terminated$),
                shareReplay()
            );

        this.opened$.subscribe(() => {
            this.setupChannels();
            this.setupPing();
        });
    }

    close() {
        this.socketConnection.close();
        this.terminatedSubj.next();
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

    private setupChannels() {
        let data$: Observable<SignalMessage> = this.socketConnection.data$
            .pipe(
                map((evt: MessageEvent) => JSON.parse(evt.data)),
                tap(data => console.log('SIGNAL: ' + data.type)),
                map(data => new SignalMessage(data)),
                share()
            );

        // todo not sure if shareReplay is correct, but it works
        this.offer$ = data$.pipe(filter(msg => msg.type === 'offer'), shareReplay());
        this.candidate$ = data$.pipe(filter(msg => msg.type === 'candidate'));
        this.hangup$ = data$.pipe(filter(msg => msg.type === 'hangup'));
        this.error$ = data$.pipe(filter(msg => msg.type === 'error'));
    }

    private setupPing() {
        interval(30000)
            .pipe(takeUntil(this.terminated$))
            .subscribe(() => this.socketConnection.send({type: 'ping'}));
    }
}
