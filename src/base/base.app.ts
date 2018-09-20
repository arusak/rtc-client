import {VideoConnector} from './video-connector.interface';
import {View} from './view.interface';
import {LoginSession} from '../shared/login-session';

export abstract class BaseApp {
    appointmentIdInput: HTMLInputElement;
    protected rootElement: HTMLElement;
    protected connectContainer: HTMLElement;
    protected errorContainer: HTMLElement;
    protected loader: HTMLElement;
    protected startButton: HTMLButtonElement;

    protected videoConnector: VideoConnector;
    protected VideoConnectorClass: new(videoSocketId: string) => VideoConnector;
    protected view: View;
    protected ViewClass: new(videoConnector: VideoConnector) => View;

    protected authParameters: { url: string, username: string, password: string };

    protected session: LoginSession;

    protected constructor() {
        this.connectContainer = document.querySelector('.connect-container');
        this.errorContainer = document.querySelector('.error-container');
        this.appointmentIdInput = document.querySelector('.appointmentId');
        this.rootElement = document.querySelector('.root');
        this.startButton = document.querySelector('.start');
        this.loader = document.querySelector('.loader');
    }

    /**
     * Authenticate and show connection button
     */
    start() {
        this.createLoginSession();
        this.session.auth().then(result => {
            this.hideLoader();
            if (result.success) {
                this.connectContainer.style.display = 'block';

                let usernameEl: HTMLElement = document.querySelector('.username');
                usernameEl.innerText = `Logged in as ${this.authParameters.username}`;
            } else {
                this.errorContainer.style.display = 'block';
                this.errorContainer.innerText = 'Authentication failed.'
            }
        });

        this.startButton.addEventListener('click', () => {
            this.connect();
        })
    }

    private connect() {
        this.connectContainer.parentElement.removeChild(this.connectContainer);
        this.showLoader();

        let appointmentId = this.appointmentIdInput.value.trim();

        this.createConnections(appointmentId).then(() => {
            this.renderView();
            this.hideLoader();
        });
    }

    private createLoginSession() {
        this.session = new LoginSession(this.authParameters.url, this.authParameters.username, this.authParameters.password);
    };

    private createConnections(appointmentId: string): Promise<any> {
        return fetch(`/api/appointment/${appointmentId}`)
            .then(r => r.json())
            .then((appointment: any) => {
                let videoSocketId = appointment.videoSession.id;
                this.videoConnector = new this.VideoConnectorClass(videoSocketId);
            });
    };

    private renderView() {
        this.view = new this.ViewClass(this.videoConnector);
        this.view.render(this.rootElement);
    };

    private showLoader() {
        this.loader.style.display = 'block';
    }

    private hideLoader() {
        this.loader.style.display = 'none';
    }
}

