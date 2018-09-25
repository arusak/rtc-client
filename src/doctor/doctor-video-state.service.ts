import {BaseVideoStateService} from '../base/base-video-state.service';

export class DoctorVideoStateService extends BaseVideoStateService {
    protected watch() {
        super.watch();

        this.signalConnection.opened$.subscribe(() => {
            this.goConnected();
        });
    }

    callButtonClicked() {
        this.goRinging();
    }

    cancelButtonClicked() {
        this.goTerminating();
    }

}