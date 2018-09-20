import {BaseView} from '../base/base.view';

export class DoctorView extends BaseView {
    private callButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;

    render(root: HTMLElement) {
        this.callButton = document.createElement('button');
        this.callButton.innerText = 'Call';
        this.callButton.addEventListener('click', () => {
            this.videoConnector.call();
        });

        this.cancelButton = document.createElement('button');
        this.cancelButton.innerText = 'Cancel';
        this.disable(this.cancelButton);
        this.cancelButton.addEventListener('click', () => {
            this.videoConnector.cancel();
        });

        super.render(root, 'Doctor', 'doctor', [this.callButton, this.cancelButton]);
    }

    protected subscribeToStreams(): void {
        super.subscribeToStreams();
        this.videoConnector.remoteStream$
            .subscribe(() => {
                this.disable(this.callButton);
                this.disable(this.cancelButton);
                this.enable(this.hangupButton);
            });

        this.videoConnector.connectionClosed$.subscribe(() => {
            this.enable(this.callButton);
            this.enable(this.cancelButton);
            this.disable(this.hangupButton);
        });
    }
}