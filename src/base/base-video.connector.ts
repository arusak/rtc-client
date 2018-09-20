import {Observable, Subject} from 'rxjs';
import {VideoConnection} from '../shared/video.connection';
import {SignalConnection} from '../shared/signal.connection';
import {VideoConnector} from './video-connector.interface';

export abstract class BaseVideoConnector implements VideoConnector {
    remoteStream$: Observable<MediaStream>;
    localStream$: Observable<MediaStream>;

    protected localStreamSubj: Subject<MediaStream>;
    protected remoteStreamSubj: Subject<MediaStream>;

    protected videoConnection: VideoConnection;
    protected signalSocket: SignalConnection;

    protected constructor(protected signalSocketId: string) {
        this.localStreamSubj = new Subject<MediaStream>();
        this.localStream$ = this.localStreamSubj.asObservable();
        this.remoteStreamSubj = new Subject<MediaStream>();
        this.remoteStream$ = this.remoteStreamSubj.asObservable();
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
        throw new Error('Not implemented');
    }
}