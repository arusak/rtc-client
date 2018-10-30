import {BaseVideoStateService} from '../base/base-video-state.service';

export class PatientVideoStateService extends BaseVideoStateService {
    protected watch() {
        super.watch();

        // в соединение приходит удалённый поток
        this.videoConnector.remoteStream$.subscribe(() => this.goInCall());

        this.chatConnection.call$.subscribe(() => {
            this.goRinging()
        });

        // в чат приходит сигнал об окончании сеанса связи
        this.chatConnection.ended$.subscribe(() => {
            if (this.stateSubj.value === 'RINGING') {
                this.goIdle();
            } else {
                this.goTerminating();
            }
        });
    }

}