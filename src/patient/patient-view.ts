import {BaseView} from '../base/base.view';

export class PatientView extends BaseView {
    private acceptButton: HTMLButtonElement;
    private declineButton: HTMLButtonElement;

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

        super.render(root, 'Patient', 'patient', [this.acceptButton, this.declineButton]);
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