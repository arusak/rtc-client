import {Observable} from 'rxjs';

export interface VideoConnector {
    remoteStream$: Observable<MediaStream>;
    localStream$: Observable<MediaStream>;
    terminated$: Observable<any>;
    started$: Observable<any>;

    /**
     * Позвонить
     */
    call(): void;

    /**
     * Прекратить сеанс
     */
    hangup(): void;

    /**
     * Принять звонок
     */
    accept(): void;

    /**
     * Отвергнуть звонок
     */
    decline(): void;

    /**
     * Отменить вызов
     */
    cancel(): void;
}