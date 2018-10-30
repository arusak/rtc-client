import {BaseVideoStateService} from '../base/base-video-state.service';

export class DoctorVideoStateService extends BaseVideoStateService {
    protected watch() {
        super.watch();

        // пациент принимает вызов
        this.chatConnection.accepted$.subscribe(() => this.goInCall());

        // при открытии сигнального канала считаем что вызов начался
        this.videoConnector.started$.subscribe(() => {
            this.goConnected();
        });

        // в чат приходит сигнал об окончании сеанса связи
        this.chatConnection.ended$.subscribe(() => {
            this.goTerminating();
        });
    }
}