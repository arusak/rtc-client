import {SignalConnection} from '../shared/signal.connection';
import {VideoConnection} from '../shared/video.connection';
import {from, Observable} from 'rxjs';
import {flatMap, mapTo, take} from 'rxjs/operators';
import {BaseVideoConnector} from '../base/base-video.connector';

export class PatientVideoConnector extends BaseVideoConnector {
    constructor(signalSocketId: string) {
        super(signalSocketId);
    }

    init() {

    }

    prepare(): Observable<any> {
        this.signalSocket = new SignalConnection(this.signalSocketId);

        return from(navigator.mediaDevices.getUserMedia({video: true, audio: true}))
            .pipe(
                flatMap((localStream: MediaStream) => {
                    this.videoConnection = new VideoConnection(localStream, this.signalSocket);
                    return this.signalSocket.offer$;
                }),
                take(1),
                mapTo(true)
            );

    }

    accept() {

    }

    decline() {

    }

}