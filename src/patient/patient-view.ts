import {BaseView} from '../base/base.view';
import {ChatConnection} from '../shared/chat.connection';
import {VideoConnector} from '../base/video-connector.interface';
import {PatientVideoStateService} from './patient-video-state.service';

export class PatientView extends BaseView {
    private acceptButton: HTMLButtonElement;
    private declineButton: HTMLButtonElement;
    private dialog: HTMLDivElement;

    constructor(videoConnector: VideoConnector, chatConnection: ChatConnection) {
        super(videoConnector, chatConnection);
        this.VideoStateServiceClass = PatientVideoStateService;
    }

    render(root: HTMLElement) {
        this.acceptButton = document.createElement('button');
        this.acceptButton.innerText = 'Accept';
        this.disable(this.acceptButton);
        this.acceptButton.addEventListener('click', () => {
            this.videoConnector.accept();
        });

        this.declineButton = document.createElement('button');
        this.declineButton.innerText = 'Decline';
        this.disable(this.declineButton);
        this.declineButton.addEventListener('click', () => {
            this.videoConnector.decline();
        });

        this.dialog = document.createElement('div');
        this.dialog.className = 'dialog';
        // this.dialog.style.display = 'none';
        this.dialog.appendChild(this.acceptButton);
        this.dialog.appendChild(this.declineButton);
        let dialogTitle = document.createElement('h3');
        dialogTitle.innerText = 'Doctor is calling';
        this.dialog.appendChild(dialogTitle);

        super.render(root, 'Patient', 'patient', [this.dialog]);
    }

    protected subscribeToStreams(): void {
        super.subscribeToStreams();
        this.chatConnection.call$.subscribe(() => {
            this.enable(this.acceptButton);
            this.enable(this.declineButton);
        });

        this.chatConnection.accepted$.subscribe(()=>{
            this.disable(this.acceptButton);
            this.disable(this.declineButton);
            this.enable(this.hangupButton);
        });

        this.chatConnection.ended$.subscribe(()=>{
            this.disable(this.acceptButton);
            this.disable(this.declineButton);
            this.disable(this.hangupButton);
        });
    }
}