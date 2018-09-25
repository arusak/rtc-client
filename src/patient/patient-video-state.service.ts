import {BaseVideoStateService} from '../base/base-video-state.service';

export class PatientVideoStateService extends BaseVideoStateService {
    protected watch() {
        super.watch();

        this.signalConnection.opened$.subscribe(() => {
            this.goRinging();
        });
    }

    acceptButtonClicked() {
        this.goConnected();
    }

    declineButtonClicked() {
        this.goTerminating();
    }

}