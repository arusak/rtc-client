import {BaseVideoConnector} from '../base/base-video.connector';

export class DoctorVideoConnector extends BaseVideoConnector {
    call() {
        this.initializeConnection();
    }

    cancel() {
        this.signalSocket.hangup();
    }
}