import {BaseView} from '../base/base.view';

export class PatientView extends BaseView {
    private acceptButton: HTMLButtonElement;
    private declineButton: HTMLButtonElement;

    render(root: HTMLElement) {
        this.acceptButton = document.createElement('button');
        this.acceptButton.innerText = 'Accept';
        this.acceptButton.addEventListener('click', () => {
            this.videoConnector.accept();
        });

        this.declineButton = document.createElement('button');
        this.declineButton.innerText = 'Decline';
        this.declineButton.addEventListener('click', () => {
            this.videoConnector.decline();
        });

        super.render(root, 'Patient', 'patient', [this.acceptButton, this.declineButton]);
    }
}