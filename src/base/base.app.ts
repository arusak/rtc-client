import {VideoConnector} from './interfaces/video-connector.interface';
import {View} from './interfaces/view.interface';
import {LoginSession} from '../shared/login-session';
import {ChatConnection} from '../shared/chat.connection';
import {AuthParameters} from './interfaces/auth-parameters.interface';

export abstract class BaseApp {
    protected videoConnector: VideoConnector;
    protected VideoConnectorClass: new(videoSocketId: string, chatConnection: ChatConnection) => VideoConnector;
    protected view: View;
    protected ViewClass: new(videoConnector: VideoConnector, chatConnection: ChatConnection) => View;
    protected authParameters: AuthParameters;

    private rootElement: HTMLElement;
    private connectForm: HTMLElement;
    private loginForm: HTMLElement;
    private errorContainer: HTMLElement;
    private loader: HTMLElement;

    private connectButton: HTMLButtonElement;
    private loginButton: HTMLButtonElement;

    private appointmentIdInput: HTMLInputElement;
    private usernameInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;


    private session: LoginSession;
    private chatConnection: ChatConnection;
    private appName: string;
    private appointmentId: string;

    protected constructor(appName: string) {
        this.connectForm = document.querySelector('.connect-form');
        this.appointmentIdInput = document.querySelector('[name=appointmentId]');
        this.connectButton = document.querySelector('.connect-btn');

        let appointmentId = localStorage.getItem('appointmentId');
        if (appointmentId) {
            this.appointmentIdInput.value = appointmentId;
        }

        this.loginForm = document.querySelector('.login-form');
        this.usernameInput = document.querySelector('[name=username]');
        this.passwordInput = document.querySelector('[name=password]');
        this.loginButton = document.querySelector('.login-btn');

        this.rootElement = document.querySelector('.root');
        this.errorContainer = document.querySelector('.error-container');
        this.loader = document.querySelector('.loader');

        this.appName = appName;
    }

    /**
     * Authenticate and show connection button
     */
    start() {
        this.renderAppName();
        this.auth();

        this.loginButton.addEventListener('click', () => {
            this.login();
        });

        this.connectButton.addEventListener('click', () => {
            this.connect();
        });
    }

    private renderAppointmentId() {
        document.querySelector('.appointment-id')['innerText'] = this.appointmentId;
    }

    private renderAppName() {
        document.querySelector('.appname')['innerText'] = this.appName;
    }

    private renderUsername(username: string) {
        let usernameEl: HTMLElement = document.querySelector('.username');
        usernameEl.innerText = `Logged in as ${username}`;
    }

    private auth() {
        this.session = new LoginSession();
        this.session.check().then(username => {
            if (!username) {
                this.show(this.loginForm);
            } else {
                this.renderUsername(username);
                this.show(this.connectForm);
                this.connect();
            }
        })
    }

    private login() {
        this.showLoader();

        this.authParameters.username = this.usernameInput.value.trim();
        this.authParameters.password = this.passwordInput.value.trim();

        this.session.auth(this.authParameters).then(result => {
            this.hideLoader();
            if (result.success) {
                this.hide(this.loginForm);
                this.show(this.connectForm);
                this.renderUsername(this.authParameters.username);
                this.connect();
            } else {
                this.showError('Authentication failed.');
            }
        });
    }

    private connect() {
        this.showLoader();

        this.appointmentId = this.appointmentIdInput.value.trim();
        this.hideError();

        this.createConnections(this.appointmentId).then(() => {
            this.hideLoader();
            if (this.chatConnection) {
                localStorage.setItem('appointmentId', this.appointmentId);
                this.hide(this.connectForm);
                this.renderView();
                this.renderAppointmentId();
            } else {
                this.showError('Connection failed.');
            }
        });
    }

    private createConnections(appointmentId: string): Promise<any> {
        return fetch(`/api/appointment/${appointmentId}`, {credentials: 'same-origin'})
            .then(r => r.json())
            .then(appointment => {
                if (appointment.state = 'ACTIVE' && appointment.chatSession && appointment.videoSession) {
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

    private show(el: HTMLElement) {
        el.style.display = 'block';
    }

    private hide(el: HTMLElement) {
        el.style.display = 'none';
    }

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

