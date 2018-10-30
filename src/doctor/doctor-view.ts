import {BaseView} from '../base/base.view';

export class DoctorView extends BaseView {
    private callButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;
    private dialog: HTMLDivElement;

    render(root: HTMLElement) {
        this.callButton = document.createElement('button');
        this.callButton.innerText = 'Call';
        this.callButton.addEventListener('click', () => {
            this.videoStateService.callButtonClicked();
            this.videoConnector.call();
            this.enable(this.cancelButton);
        });

        this.cancelButton = document.createElement('button');
        this.cancelButton.innerText = 'Cancel';
        this.disable(this.cancelButton);
        this.cancelButton.addEventListener('click', () => {
            this.videoStateService.cancelButtonClicked();
            this.videoConnector.cancel();
        });

        this.dialog = document.createElement('div');
        this.dialog.className = 'dialog';
        this.dialog.style.display = 'none';
        this.dialog.appendChild(this.cancelButton);
        let dialogTitle = document.createElement('h3');
        dialogTitle.innerText = 'Calling patient';
        this.dialog.appendChild(dialogTitle);

        super.render(root, 'Doctor', 'doctor', [this.callButton, this.dialog]);
    }

    protected subscribeToStreams(): void {
        super.subscribeToStreams();

        this.videoStateService.state$.subscribe(state => {
            switch (state) {
                case 'IDLE':
                    this.hideRingingDialog();
                    this.hideVideo();
                    this.enable(this.callButton);
                    break;
                case 'RINGING':
                    this.disable(this.callButton);
                    this.showRingingDialog();
                    break;
                case 'CONNECTED':
                    this.enableVideoControls();
                    break;
                case 'IN_CALL':
                    this.hideRingingDialog();
                    this.showVideo();
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

    private showRingingDialog(){
        this.show(this.dialog);
    }

    private hideRingingDialog(){
        this.hide(this.dialog);
    }
}