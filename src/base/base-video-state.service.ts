import {ChatConnection} from '../shared/chat.connection';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter} from 'rxjs/operators';
import {VideoState, VideoStateService} from './interfaces/video-state-service.interface';
import {VideoConnection} from '../shared/video.connection';

export class BaseVideoStateService implements VideoStateService {
    state$: Observable<VideoState>;
    protected stateSubj: BehaviorSubject<VideoState>;

    constructor(protected videoConnection: VideoConnection, protected chatConnection: ChatConnection) {
        this.stateSubj = new BehaviorSubject(<VideoState>'IDLE');
        this.state$ = this.stateSubj.pipe(filter(s => s !== null));

        this.watch();
    }

    callButtonClicked() {
        this.goRinging();
    }

    cancelButtonClicked() {
        this.goTerminating();
    }

    hangupButtonClicked() {
        this.goTerminating();
    }

    acceptButtonClicked() {
        this.goConnected();
    }

    declineButtonClicked() {
        this.goTerminating();
    }

    protected watch() {
        // разорвано подключение
        this.videoConnection.terminated$.subscribe(() => {
            this.stateSubj.next('IDLE');
        });
    }

    protected goTerminating() {
        switch (this.stateSubj.value) {
            case 'RINGING':
            case 'CONNECTED':
            case 'IN_CALL':
                this.stateSubj.next('TERMINATING');
                break;
            case 'TERMINATING':
                // может прилететь несколько поводов для отключения подряд - игнорируем
                break;
            default:
                this.stateSwitchError('TERMINATING')
        }
    }

    protected goRinging() {
        switch (this.stateSubj.value) {
            case 'IDLE':
                this.stateSubj.next('RINGING');
                break;
            default:
                this.stateSwitchError('RINGING')
        }
    }

    protected goConnected() {
        switch (this.stateSubj.value) {
            case 'RINGING':
                this.stateSubj.next('CONNECTED');
                break;
            default:
                this.stateSwitchError('CONNECTED')
        }
    }

    protected goIdle() {
        switch (this.stateSubj.value) {
            case 'RINGING':
            case 'TERMINATING':
                this.stateSubj.next('IDLE');
                break;
            default:
                this.stateSwitchError('IDLE')
        }
    }

    protected goInCall() {
        switch (this.stateSubj.value) {
            case 'CONNECTED':
                this.stateSubj.next('IN_CALL');
                break;
            default:
                this.stateSwitchError('IN_CALL')
        }
    }

    private stateSwitchError(attempted: VideoState) {
        console.log(`[STATE] Incorrect state switch attempt. Current: ${this.stateSubj.value}, attempted: ${attempted}`)
    }

}

