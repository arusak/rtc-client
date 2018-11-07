import {BaseView} from '../base/base.view';

export class PatientView extends BaseView {
    private acceptButton: HTMLButtonElement;
    private declineButton: HTMLButtonElement;
    private dialog: HTMLDivElement;

    render(root: HTMLElement) {
        this.acceptButton = document.createElement('button');
        this.acceptButton.innerText = 'Accept';
        this.acceptButton.addEventListener('click', () => {
            this.videoConnection.accept();
            this.videoStateService.acceptButtonClicked();
        });

        this.declineButton = document.createElement('button');
        this.declineButton.innerText = 'Decline';
        this.declineButton.addEventListener('click', () => {
            this.videoConnection.decline();
            this.videoStateService.declineButtonClicked();
        });

        this.dialog = document.createElement('div');
        this.dialog.className = 'dialog';
        this.dialog.style.display = 'none';
        this.dialog.appendChild(this.acceptButton);
        this.dialog.appendChild(this.declineButton);
        let dialogTitle = document.createElement('h3');
        dialogTitle.innerText = 'Doctor is calling';
        this.dialog.appendChild(dialogTitle);

        super.render(root, 'Patient', 'patient', [this.dialog]);
    }

    protected subscribeToStreams(): void {
        super.subscribeToStreams();

        this.videoStateService.state$.subscribe(state => {
            switch (state) {
                case 'IDLE':
                    this.hideRingingDialog();
                    this.hideVideo();
                    break;
                case 'RINGING':
                    this.showRingingDialog();
                    break;
                case 'CONNECTED':
                    this.hideRingingDialog();
                    this.showVideo();
                    break;
                case 'IN_CALL':
                    this.enableVideoControls();
                    break;
                case 'TERMINATING':
                    this.hideRingingDialog();
                    this.hideVideo();
                    this.disableVideoControls();
                    break;
                case 'CONNECTION_ERROR':
                    break;
            }
        });
    }

    private showRingingDialog() {
        this.show(this.dialog);
    }

    private hideRingingDialog() {
        this.hide(this.dialog);
    }

}