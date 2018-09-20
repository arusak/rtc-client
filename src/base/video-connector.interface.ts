import {Observable} from 'rxjs';

export interface VideoConnector {
    remoteStream$: Observable<MediaStream>;
    localStream$: Observable<MediaStream>;

    call(): void;

    hangup(): void;

    accept(): void;

    decline(): void;
}