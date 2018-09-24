import {VideoConnector} from './video-connector.interface';
import {ChatConnection} from '../shared/chat.connection';

export abstract class BaseView {
    protected remoteVideo: HTMLMediaElement;
    protected localVideo: HTMLMediaElement;
    protected hangupButton: HTMLButtonElement;
    private videoContainer: HTMLDivElement;

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

        this.videoContainer = document.createElement('div');
        this.videoContainer.className = 'video-container';
        this.videoContainer.style.display = 'none';
        this.videoContainer.appendChild(this.remoteVideo);
        this.videoContainer.appendChild(this.localVideo);

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
        app.appendChild(buttonsContainer);
        app.appendChild(this.videoContainer);

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
            this.videoContainer.style.display = 'none';
            this.localVideo.pause();
            this.remoteVideo.pause();
        });

        this.chatConnection.accepted$.subscribe(() => {
            this.showVideo();
        });

        this.chatConnection.ended$.subscribe(() => {
            this.hideVideo();
        });

    }

    protected disable(el: HTMLElement) {
        el.setAttribute('disabled', 'disabled');
    }

    protected enable(el: HTMLElement) {
        el.removeAttribute('disabled');
    }

    protected showVideo() {
        this.videoContainer.style.display = 'inline-block';
    }

    protected hideVideo() {
        this.videoContainer.style.display = 'none';
    }

}