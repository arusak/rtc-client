import {BaseView} from '../base/base.view';
import {VideoConnector} from '../base/interfaces/video-connector.interface';
import {ChatConnection} from '../shared/chat.connection';
import {DoctorVideoStateService} from './doctor-video-state.service';

export class DoctorView extends BaseView {
    private callButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;
    private dialog: HTMLDivElement;


    constructor(videoConnector: VideoConnector, chatConnection: ChatConnection) {
        super(videoConnector, chatConnection);
    }

    render(root: HTMLElement) {
        this.callButton = document.createElement('button');
        this.callButton.innerText = 'Call';
        this.callButton.addEventListener('click', () => {
            this.videoConnector.call();
            this.enable(this.cancelButton);
        });

        this.cancelButton = document.createElement('button');
        this.cancelButton.innerText = 'Cancel';
        this.disable(this.cancelButton);
        this.cancelButton.addEventListener('click', () => {
            this.videoConnector.cancel();
        });

        this.dialog = document.createElement('div');
        this.dialog.className = 'dialog';
        // this.dialog.style.display = 'none';
        this.dialog.appendChild(this.cancelButton);
        let dialogTitle = document.createElement('h3');
        dialogTitle.innerText = 'Calling patient';
        this.dialog.appendChild(dialogTitle);

        super.render(root, 'Doctor', 'doctor', [this.callButton, this.cancelButton]);
    }

    protected subscribeToStreams(): void {


        super.subscribeToStreams();
        this.videoConnector.remoteStream$.subscribe(() => {
            this.disable(this.callButton);
            this.disable(this.cancelButton);
            this.enable(this.hangupButton);
        });

        this.videoConnector.terminated$.subscribe(() => {
            this.hideVideo();
            this.enable(this.callButton);
            this.disable(this.cancelButton);
            this.disable(this.hangupButton);
        });

        this.chatConnection.call$.subscribe(() => {
            this.enable(this.cancelButton);
        });

        this.chatConnection.accepted$.subscribe(() => {
            this.disable(this.cancelButton);
        });

        this.chatConnection.ended$.subscribe(() => {
            this.disable(this.cancelButton);
        });
    }
}