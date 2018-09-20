import {from, Observable, Subject} from 'rxjs';
import {VideoConnection} from '../shared/video.connection';
import {SignalConnection} from '../shared/signal.connection';
import {VideoConnector} from './video-connector.interface';
import {flatMap, take} from 'rxjs/operators';

export abstract class BaseVideoConnector implements VideoConnector {
    remoteStream$: Observable<MediaStream>;
    localStream$: Observable<MediaStream>;
    connectionClosed$: Observable<any>;

    protected localStreamSubj: Subject<MediaStream>;
    protected remoteStreamSubj: Subject<MediaStream>;
    protected connectionClosedSubj: Subject<MediaStream>;

    protected videoConnection: VideoConnection;
    protected signalSocket: SignalConnection;

    protected constructor(protected signalSocketId: string) {
        this.localStreamSubj = new Subject<MediaStream>();
        this.localStream$ = this.localStreamSubj.asObservable();
        this.remoteStreamSubj = new Subject<MediaStream>();
        this.remoteStream$ = this.remoteStreamSubj.asObservable();
        this.connectionClosedSubj = new Subject<MediaStream>();
        this.connectionClosed$ = this.connectionClosedSubj.asObservable();
    }

    /**
     * Получить доступ к медиа-устройствам, создать соединение с сигнальным каналом и каналом данных
     * @param {boolean} passive пассивный режим: ожидать оффера, не посылая сообщение call
     */
    protected initializeConnection(passive?: boolean) {
        this.initializeSignalSocket();

        console.log('Requesting access to devices');
        from(navigator.mediaDevices.getUserMedia({video: true, audio: true}))
            .pipe(
                flatMap((localStream: MediaStream) => {
                    this.localStreamSubj.next(localStream);
                    console.log('Got access. Got local stream. Creating a new video connection');
                    this.videoConnection = new VideoConnection(localStream, this.signalSocket);
                    if (!passive) this.sendCall();
                    console.log('Waiting for remote stream');
                    return this.videoConnection.remoteStream$;
                }),
                take(1)
            )
            .subscribe(remoteStream => {
                console.log('Got a remote stream');
                this.remoteStreamSubj.next(remoteStream);
            });

    }

    private initializeSignalSocket() {
        console.log('Initializing a signal socket');
        this.signalSocket = new SignalConnection(this.signalSocketId);
        this.signalSocket.hangup$
            .pipe(take(1))
            .subscribe(() => {
                console.log('Closing connections');
                this.signalSocket.close();
                this.videoConnection.close();
                this.connectionClosedSubj.next();
            });
        this.signalSocket.error$.subscribe(console.error);
    }

    private sendCall() {
        console.log('Sending call to signal socket');
        this.signalSocket.call();
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
}