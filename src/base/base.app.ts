import {VideoConnector} from './video-connector.interface';
import {View} from './view.interface';
import {LoginSession} from '../shared/login-session';
import {ChatConnection} from '../shared/chat.connection';

export abstract class BaseApp {
    appointmentIdInput: HTMLInputElement;
    protected rootElement: HTMLElement;
    protected connectContainer: HTMLElement;
    protected errorContainer: HTMLElement;
    protected loader: HTMLElement;
    protected startButton: HTMLButtonElement;

    protected videoConnector: VideoConnector;
    protected VideoConnectorClass: new(videoSocketId: string, chatConnection: ChatConnection) => VideoConnector;
    protected view: View;
    protected ViewClass: new(videoConnector: VideoConnector, chatConnection: ChatConnection) => View;

    protected authParameters: { url: string, username: string, password: string };

    protected session: LoginSession;
    private chatConnection: ChatConnection;
    private appName: string;

    protected constructor(appName: string) {
        this.connectContainer = document.querySelector('.connect-container');
        this.errorContainer = document.querySelector('.error-container');
        this.appointmentIdInput = document.querySelector('.appointmentId');
        this.rootElement = document.querySelector('.root');
        this.startButton = document.querySelector('.start');
        this.loader = document.querySelector('.loader');
        this.appName = appName;
    }

    /**
     * Authenticate and show connection button
     */
    start() {
        this.renderAppName();
        this.createLoginSession();
        this.session.auth().then(result => {
            this.hideLoader();
            if (result.success) {
                this.connectContainer.style.display = 'block';

                let usernameEl: HTMLElement = document.querySelector('.username');
                usernameEl.innerText = `Logged in as ${this.authParameters.username}`;

                this.connect();
            } else {
                this.showError('Authentication failed.');
            }
        });

        this.startButton.addEventListener('click', () => {
            this.connect();
        });
    }

    private renderAppName() {
        document.querySelector('.appname')['innerText'] = this.appName;
    }

    private connect() {
        this.showLoader();

        let appointmentId = this.appointmentIdInput.value.trim();
        this.hideError();

        this.createConnections(appointmentId).then(() => {
            this.hideLoader();
            if (this.chatConnection) {
                this.connectContainer.parentElement.removeChild(this.connectContainer);
                this.renderView();
            } else {
                this.errorContainer.style.display = 'block';
                this.errorContainer.innerText = 'Connection failed.'
            }
        });
    }

    private createLoginSession() {
        this.session = new LoginSession(this.authParameters.url, this.authParameters.username, this.authParameters.password);
    };

    private createConnections(appointmentId: string): Promise<any> {
        return fetch(`/api/appointment/${appointmentId}`, {credentials: 'same-origin'})
            .then(r => r.json())
            .then((appointment: any) => {
                if (appointment.chatSession) {
                    let videoSocketId = appointment.videoSession.id;
                    let chatSocketId = appointment.chatSession.id;
                    this.chatConnection = new ChatConnection(chatSocketId);
                    this.videoConnector = new this.VideoConnectorClass(videoSocketId, this.chatConnection);
                }
            });
    };

    private renderView() {
        this.view = new this.ViewClass(this.videoConnector, this.chatConnection);
        this.view.render(this.rootElement);
    };

    private showLoader() {
        this.loader.style.display = 'block';
    }

    private hideLoader() {
        this.loader.style.display = 'none';
    }

    private showError(text: string) {
        this.errorContainer.style.display = 'block';
        this.errorContainer.innerText = text;
    }

    private hideError() {
        this.errorContainer.style.display = 'none';
    }
}

