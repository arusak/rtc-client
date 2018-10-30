import {WebSocketConnection} from './web-socket-connection.class';
import {Observable} from 'rxjs';
import {filter, map, share, tap} from 'rxjs/operators';
import {ChatMessage} from './models/chat-message.model';
import * as moment from 'moment';

export class ChatConnection {
    call$: Observable<any>;
    ended$: Observable<any>;
    error$: Observable<any>;
    accepted$: Observable<any>;

    private socketConnection: WebSocketConnection;

    constructor(socketId: string) {
        this.connect(socketId);
        this.setupChannels();
    }

    private connect(socketId: string) {
        this.log('Initializing chat connection');
        this.socketConnection = new WebSocketConnection();
        this.socketConnection.connect(`chat/${socketId}`);
    }

    private setupChannels() {
        let start = moment();
        const data$ = this.socketConnection.data$
            .pipe(
                map(msgEvt => new ChatMessage(JSON.parse(msgEvt.data))),
                filter((msg: ChatMessage) => msg.timestamp.isAfter(start)),
                tap((msg: ChatMessage) => this.log(`${msg.type}`)),
                share());

        this.call$ = data$.pipe(filter(msg => msg.type === 'VIDEO_CALL_STARTED'));
        this.ended$ = data$.pipe(filter(msg => ['VIDEO_CALL_CANCELLED', 'VIDEO_CALL_IGNORED', 'VIDEO_CALL_DECLINED', 'VIDEO_CALL_ENDED'].includes(msg.type)));
        this.error$ = data$.pipe(filter(msg => ['VIDEO_CALL_ERROR'].includes(msg.type)));
        this.accepted$ = data$.pipe(filter(msg => ['VIDEO_CALL_ACCEPTED'].includes(msg.type)));
    }

    close() {
        this.socketConnection.close();
    }

    private log(...messages) {
        let text = messages.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg).join(' ');
        console.log(`%c[CHAT] ${text}`, 'color: #999');
    }

}