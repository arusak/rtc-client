import {BaseVideoConnector} from '../base/base-video.connector';

export class DoctorVideoConnector extends BaseVideoConnector {
    constructor(signalSocketId: string) {
        super(signalSocketId);
    }

    call() {
        this.initializeConnection();
    }

    cancel() {
        this.signalSocket.hangup();
    }
}