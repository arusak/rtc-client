import {Observable} from 'rxjs';

export interface VideoStateService {
    state$: Observable<VideoState>;
}

export declare type VideoState =
    'IDLE' |
    'IN_CALL' |
    'CONNECTED' |
    'RINGING' |
    'TERMINATING' |
    'COMMUNICATION_BREAKDOWN' |
    'CONNECTION_ERROR' |
    'INCORRECT_STATE_ERROR';