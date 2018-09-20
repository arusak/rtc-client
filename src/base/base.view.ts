import {VideoConnector} from './video-connector.interface';

export abstract class BaseView {
    protected remoteVideo: HTMLMediaElement;
    protected localVideo: HTMLMediaElement;

    constructor(protected videoConnector: VideoConnector) {
        this.subscribeToStreams();
    }

    render(root: HTMLElement, title: string, className: string, buttons: HTMLButtonElement[]) {
        let titleElement = document.createElement('h2');
        titleElement.textContent = title;

        this.remoteVideo = document.createElement('video');
        this.remoteVideo.className = 'remote';
        this.localVideo = document.createElement('video');
        this.localVideo.className = 'local';


        let buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons';

        buttons.forEach(button => {
            buttonsContainer.appendChild(button);
        });

        let doctorContainer = document.createElement('div');
        doctorContainer.className = 'doctor';

        doctorContainer.appendChild(titleElement);
        doctorContainer.appendChild(this.remoteVideo);
        doctorContainer.appendChild(this.localVideo);
        doctorContainer.appendChild(buttonsContainer);

        root.appendChild(doctorContainer);
    }

    private subscribeToStreams() {
        if (!this.videoConnector) {
            throw new Error('Unable to initialize View. Video connector is not ready');
        }

        this.videoConnector.remoteStream$.subscribe(stream => {
            this.remoteVideo.srcObject = stream;
        });

        this.videoConnector.localStream$.subscribe(stream => {
            this.localVideo.srcObject = stream;
        });
    }

}