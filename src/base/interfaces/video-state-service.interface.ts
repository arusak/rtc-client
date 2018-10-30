import {Observable} from 'rxjs';

export interface VideoStateService {
    state$: Observable<VideoState>;

    callButtonClicked();

    cancelButtonClicked();

    hangupButtonClicked();

    acceptButtonClicked();

    declineButtonClicked();
}

export declare type VideoState =
    'IDLE' |
    'IN_CALL' |
    'CONNECTED' |
    'RINGING' |
    'TERMINATING' |
    'CONNECTION_ERROR';
