import {VideoConnector} from './interfaces/video-connector.interface';
import {VideoStateService} from './interfaces/video-state-service.interface';

export abstract class BaseView {
    protected remoteVideo: HTMLMediaElement;
    protected localVideo: HTMLMediaElement;
    protected hangupButton: HTMLButtonElement;

    private videoContainer: HTMLDivElement;
    private state: HTMLTextAreaElement;

    constructor(protected videoConnector: VideoConnector,
                protected videoStateService: VideoStateService) {
        this.subscribeToStreams();
    }

    render(root: HTMLElement, title: string, className: string, elements: HTMLElement[]) {
        this.remoteVideo = document.createElement('video');
        this.remoteVideo.className = 'remote';
        this.localVideo = document.createElement('video');
        this.localVideo.muted = true;
        this.localVideo.className = 'local';

        this.state = document.createElement('textarea');
        this.state.className = 'state';

        this.videoContainer = document.createElement('div');
        this.videoContainer.className = 'video-container';
        this.videoContainer.style.display = 'none';
        this.videoContainer.appendChild(this.remoteVideo);
        this.videoContainer.appendChild(this.localVideo);

        this.hangupButton = document.createElement('button');
        this.hangupButton.innerText = 'Hang up';
        this.disable(this.hangupButton);
        this.hangupButton.addEventListener('click', () => {
            this.videoConnector.hangup();
        });
        this.videoContainer.appendChild(this.hangupButton);

        let app = document.createElement('div');
        app.className = className;

        elements.forEach(el => {
            app.appendChild(el);
        });
        app.appendChild(this.state);
        app.appendChild(this.videoContainer);

        root.appendChild(app);
    }

    protected subscribeToStreams() {
        if (!this.videoConnector) {
            throw new Error('Unable to initialize View. Video connector is not ready');
        }

        this.videoConnector.remoteStream$.subscribe(stream => {
            this.log('Starting remote video');
            this.remoteVideo.srcObject = stream;
            this.remoteVideo.play().catch(console.error);
        });

        this.videoConnector.localStream$.subscribe(stream => {
            this.log('Starting local video');
            this.localVideo.srcObject = stream;
            this.localVideo.play().catch(console.error);
        });

        this.videoConnector.terminated$.subscribe(() => this.stopVideos());

        this.videoStateService.state$.subscribe(state => {
            if (this.state) this.state.value += state + '\n';
        });
    }

    protected stopVideos() {
        this.log('Stopping videos');
        this.localVideo.srcObject = null;
        this.remoteVideo.srcObject = null;
    }

    protected disable(el: HTMLElement) {
        if (!el) return;
        el.setAttribute('disabled', 'disabled');
    }

    protected enable(el: HTMLElement) {
        if (!el) return;
        el.removeAttribute('disabled');
    }

    protected showVideo() {
        if (!this.videoContainer) return;
        this.videoContainer.style.display = 'inline-block';
    }

    protected hideVideo() {
        this.hide(this.videoContainer);
    }

    protected hide(el: HTMLElement) {
        if (!el) return;
        el.style.display = 'none';
    }

    protected show(el: HTMLElement) {
        if (!el) return;
        el.style.display = 'block';
    }

    protected enableVideoControls() {
        this.enable(this.hangupButton);
    }

    protected disableVideoControls() {
        this.disable(this.hangupButton);
    }

    protected log(...messages) {
        let text = messages.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg).join(' ');
        console.log(`%c[VIEW] ${text}`, 'color: #074');
    }
}