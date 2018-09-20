import {WebSocketConnection} from './web-socket-connection.class';
import {Observable} from 'rxjs';
import {filter, map, share, tap} from 'rxjs/operators';
import {ChatMessage} from './chat-message.model';

export class ChatConnection {
    call$: Observable<any>;
    ended$: Observable<any>;
    accepted$: Observable<any>;

    private socketConnection: WebSocketConnection;

    constructor(socketId: string) {
        this.connect(socketId);
        this.setupChannels();
    }

    private connect(socketId: string) {
        console.log('Initializing chat connection');
        this.socketConnection = new WebSocketConnection();
        this.socketConnection.connect(`ws/chat/${socketId}`);
    }

    private setupChannels() {
        const data$ = this.socketConnection.data$
            .pipe(
                map(msgEvt => JSON.parse(msgEvt.data)),
                tap((msg: ChatMessage) => console.log('CHAT: ' + msg.type)),
                share());

        this.call$ = data$.pipe(filter(msg => msg.type === 'VIDEO_CALL_STARTED'));
        this.ended$ = data$.pipe(filter(msg => ['VIDEO_CALL_CANCELLED', 'VIDEO_CALL_IGNORED', 'VIDEO_CALL_DECLINED'].includes(msg.type)));
        this.accepted$ = data$.pipe(filter(msg => ['VIDEO_CALL_ACCEPTED'].includes(msg.type)));

    }

    close() {
        this.socketConnection.close();
    }
}