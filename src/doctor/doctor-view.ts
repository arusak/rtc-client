import {BaseView} from '../base/base.view';

export class DoctorView extends BaseView {
    private callButton: HTMLButtonElement;
    private hangupButton: HTMLButtonElement;

    render(root: HTMLElement) {
        this.callButton = document.createElement('button');
        this.callButton.innerText = 'Call';
        this.callButton.addEventListener('click', () => {
            this.videoConnector.call();
        });

        this.hangupButton = document.createElement('button');
        this.hangupButton.innerText = 'Hang up';
        this.hangupButton.addEventListener('click', () => {
            this.videoConnector.hangup();
        });

        super.render(root, 'Doctor', 'doctor', [this.callButton, this.hangupButton]);
    }
}