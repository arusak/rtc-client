import {VideoConnection} from '../shared/video.connection';
import {ChatConnection} from '../shared/chat.connection';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter} from 'rxjs/operators';
import {SignalConnection} from '../shared/signal.connection';
import {VideoState} from './interfaces/video-state-service.interface';
import {VideoConnector} from './interfaces/video-connector.interface';

export class BaseVideoStateService {
    state$: Observable<VideoState>;
    protected stateSubj: BehaviorSubject<VideoState>;

    constructor(protected videoConnector: VideoConnector, protected chatConnection: ChatConnection) {
        this.stateSubj = new BehaviorSubject(null);
        this.state$ = this.stateSubj.pipe(filter(s => s !== null));

        this.watch();
    }

    protected watch() {
        this.videoConnector.remoteStream$.subscribe(() => {
            switch (this.stateSubj.value) {
                case 'CONNECTED':
                    this.stateSubj.next('IN_CALL');
                    break;
                default:
            }
        });

        this.chatConnection.ended$.subscribe(() => {
            this.goTerminating();
        });

        this.videoConnector.terminated$.subscribe(() => {
            switch (this.stateSubj.value) {
                case 'TERMINATING':
                    this.stateSubj.next('IDLE');
                    break;
                default:
                    this.stateSubj.next('COMMUNICATION_BREAKDOWN');
            }
        });
    }

    hangupButtonClicked() {
        this.goTerminating();
    }

    protected goTerminating() {
        switch (this.stateSubj.value) {
            case 'RINGING':
            case 'CONNECTED':
            case 'IN_CALL':
                this.stateSubj.next('TERMINATING');
                break;
        }
    }

    protected goRinging(){
        switch (this.stateSubj.value) {
            case 'IDLE':
                this.stateSubj.next('RINGING');
                break;
        }
    }

    protected goConnected(){
        switch (this.stateSubj.value) {
            case 'RINGING':
                this.stateSubj.next('CONNECTED');
                break;
        }
    }

}

