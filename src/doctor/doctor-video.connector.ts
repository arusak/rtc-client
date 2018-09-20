import {SignalConnection} from '../shared/signal.connection';
import {VideoConnection} from '../shared/video.connection';
import {from} from 'rxjs';
import {flatMap, take} from 'rxjs/operators';
import {BaseVideoConnector} from '../base/base-video.connector';

export class DoctorVideoConnector extends BaseVideoConnector {
    constructor(signalSocketId: string) {
        super(signalSocketId);
    }

    init() {

    }

    call() {
        console.log('DOCCONN. Creating a signal socket');
        this.signalSocket = new SignalConnection(this.signalSocketId);

        console.log('DOCCONN. Requesting access to devices');
        from(navigator.mediaDevices.getUserMedia({video: true, audio: true}))
            .pipe(
                flatMap((localStream: MediaStream) => {
                    this.localStreamSubj.next(localStream);
                    console.log('DOCCONN. Got access. Got local stream. Creating a new video connection');
                    this.videoConnection = new VideoConnection(localStream, this.signalSocket);
                    console.log('DOCCONN. Sending call to signal socket');
                    this.signalSocket.call();
                    console.log('DOCCONN. Waiting for remote stream');
                    return this.videoConnection.remoteStream$;
                }),
                take(1)
            )
            .subscribe(remoteStream => {
                console.log('DOCCONN. Got a remote stream');
                this.remoteStreamSubj.next(remoteStream);
            });
    }

    hangup() {

    }
}