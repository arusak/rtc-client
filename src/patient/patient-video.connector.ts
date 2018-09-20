import {SignalConnection} from '../shared/signal.connection';
import {BaseVideoConnector} from '../base/base-video.connector';

export class PatientVideoConnector extends BaseVideoConnector {
    constructor(signalSocketId: string) {
        super(signalSocketId);
    }

    accept() {
        this.initializeConnection(true);
    }

    /**
     * Отвергуть входящий вызов
     */
    decline() {
        this.signalSocket = new SignalConnection(this.signalSocketId);
        this.signalSocket.hangup();
        this.signalSocket.close();
    }

}