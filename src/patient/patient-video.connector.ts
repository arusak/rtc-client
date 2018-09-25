import {SignalConnection} from '../shared/signal.connection';
import {BaseVideoConnector} from '../base/base-video.connector';

export class PatientVideoConnector extends BaseVideoConnector {
    accept() {
        this.initializeConnection(true);
    }

    /**
     * Отвергуть входящий вызов
     */
    decline() {
        this.signalSocket = new SignalConnection(this.signalSocketId);
        this.signalSocket.opened$.subscribe(() => {
            this.signalSocket.hangup();
            this.signalSocket.close();
        });
    }

}