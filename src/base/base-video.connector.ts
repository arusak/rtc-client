import {from, merge, Observable, Subject} from 'rxjs';
import {VideoConnection} from '../shared/video.connection';
import {SignalConnection} from '../shared/signal.connection';
import {VideoConnector} from './interfaces/video-connector.interface';
import {flatMap, map, take, tap} from 'rxjs/operators';
import {ChatConnection} from '../shared/chat.connection';
import {ajax, AjaxResponse} from 'rxjs/ajax';

export abstract class BaseVideoConnector implements VideoConnector {
    remoteStream$: Observable<MediaStream>;
    localStream$: Observable<MediaStream>;
    terminated$: Observable<any>;
    started$: Observable<any>;

    protected localStreamSubj: Subject<MediaStream>;
    protected remoteStreamSubj: Subject<MediaStream>;
    protected terminatedSubj: Subject<any>;
    protected startedSubj: Subject<any>;

    protected videoConnection: VideoConnection;
    protected signalSocket: SignalConnection;

    private rtcConfig: any;

    constructor(protected signalSocketId: string, protected chatConnection: ChatConnection) {
        this.prepareRtcConfig();

        this.localStreamSubj = new Subject<MediaStream>();
        this.localStream$ = this.localStreamSubj.asObservable();
        this.remoteStreamSubj = new Subject<MediaStream>();
        this.remoteStream$ = this.remoteStreamSubj.asObservable();
        this.terminatedSubj = new Subject<any>();
        this.terminated$ = this.terminatedSubj.asObservable();
        this.startedSubj = new Subject<any>();
        this.started$ = this.startedSubj.asObservable();
    }

    accept(): void {
        throw new Error('Not implemented');
    }

    call(): void {
        throw new Error('Not implemented');
    }

    decline(): void {
        throw new Error('Not implemented');
    }

    hangup(): void {
        this.signalSocket.hangup();
    }

    cancel(): void {
        throw new Error('Not implemented');
    }

    /**
     * Получить доступ к медиа-устройствам, создать соединение с сигнальным каналом и каналом данных
     * @param {boolean} passive пассивный режим: ожидать оффера, не посылая сообщение call
     */
    // todo убрать спагетти, разнести получение медиа и создание видео-соединения
    protected initializeConnection(passive?: boolean) {
        this.initializeSignalSocket();
        this.setupChatWatch();

        this.log('Requesting access to devices');
        from(navigator.mediaDevices.getUserMedia({video: true, audio: true}))
            .pipe(
                flatMap((localStream: MediaStream) => {
                    this.localStreamSubj.next(localStream);
                    this.log('Got access. Got local stream. Creating a new video connection');
                    this.videoConnection = new VideoConnection(localStream, this.signalSocket, this.rtcConfig);
                    if (!passive) this.sendCall();
                    this.log('Waiting for remote stream');
                    return this.videoConnection.remoteStream$;
                }),
                take(1)
            )
            .subscribe(remoteStream => {
                this.log('Got a remote stream');
                this.remoteStreamSubj.next(remoteStream);
            });
    }

    protected setupChatWatch() {
        // When video call ends, close everything
        merge(this.chatConnection.ended$, this.chatConnection.error$)
            .pipe(take(1))
            .subscribe(() => {
                this.log('Closing connections');
                this.signalSocket.close();
                this.videoConnection.close();
                this.terminatedSubj.next();
            });
    }

    protected log(...messages) {
        let text = messages.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg).join(' ');
        console.log(`%c[CONNECTOR] ${text}`, 'color: #b0b');
    }

    private initializeSignalSocket() {
        this.log('Initializing a signal socket');
        this.signalSocket = new SignalConnection(this.signalSocketId);

        // при открытии сигнального сокета сигнализируем об успешном подключении
        // и подписываемся на сообщения об ошибках
        this.signalSocket.opened$
            .pipe(
                tap(() => this.startedSubj.next()),
                flatMap(() => this.signalSocket.error$),
            )
            .subscribe(console.error);
    }

    private prepareRtcConfig() {
        ajax('/api/systeminfo')
            .pipe(map((resp: AjaxResponse) => resp.response))
            .subscribe((systemInfo: { key: string, value: string }[]) => {
                this.rtcConfig = {
                    iceTransportPolicy: 'relay',
                    iceServers: [{
                        urls: systemInfo.find(param => param.key === 'RTC_TURN_URL').value,
                        username: systemInfo.find(param => param.key === 'RTC_TURN_LOGIN').value,
                        credential: systemInfo.find(param => param.key === 'RTC_TURN_PASSWORD').value,
                    }]
                };
            });
    }

    private sendCall() {
        this.log('Sending call to signal socket');
        this.signalSocket.call();
    }
}