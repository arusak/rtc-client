import {VideoConnector} from './video-connector.interface';
import {ChatConnection} from '../shared/chat.connection';

export abstract class BaseView {
    protected remoteVideo: HTMLMediaElement;
    protected localVideo: HTMLMediaElement;
    protected hangupButton: HTMLButtonElement;

    constructor(protected videoConnector: VideoConnector, protected chatConnection: ChatConnection) {
        this.subscribeToStreams();
    }

    render(root: HTMLElement, title: string, className: string, buttons: HTMLButtonElement[]) {
        let titleElement = document.createElement('h2');
        titleElement.textContent = title;

        this.remoteVideo = document.createElement('video');
        this.remoteVideo.className = 'remote';
        this.localVideo = document.createElement('video');
        this.localVideo.muted = true;
        this.localVideo.className = 'local';

        let videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.appendChild(this.remoteVideo);
        videoContainer.appendChild(this.localVideo);

        let buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons';

        this.hangupButton = document.createElement('button');
        this.hangupButton.innerText = 'Hang up';
        this.disable(this.hangupButton);
        this.hangupButton.addEventListener('click', () => {
            this.videoConnector.hangup();
        });
        buttons.push(this.hangupButton);

        buttons.forEach(button => {
            buttonsContainer.appendChild(button);
        });

        let app = document.createElement('div');
        app.className = className;

        app.appendChild(titleElement);
        app.appendChild(videoContainer);
        app.appendChild(buttonsContainer);

        root.appendChild(app);
    }

    protected subscribeToStreams() {
        if (!this.videoConnector) {
            throw new Error('Unable to initialize View. Video connector is not ready');
        }

        this.videoConnector.remoteStream$.subscribe(stream => {
            console.log('Starting remote video');
            this.remoteVideo.srcObject = stream;
            this.remoteVideo.play().catch(console.error);
        });

        this.videoConnector.localStream$.subscribe(stream => {
            console.log('Starting local video');
            this.localVideo.srcObject = stream;
            this.localVideo.play().catch(console.error);
        });

        this.videoConnector.connectionClosed$.subscribe(() => {
            console.log('Stopping videos');
            this.localVideo.pause();
            this.remoteVideo.pause();
        });
    }

    protected disable(el: HTMLElement) {
        el.setAttribute('disabled', 'disabled');
    }

    protected enable(el: HTMLElement) {
        el.removeAttribute('disabled');
    }

}