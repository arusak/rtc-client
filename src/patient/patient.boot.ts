import 'webrtc-adapter';
import '../style.less';
import {PatientApp} from './patient.app';

window.onload = () => {
    let app = new PatientApp();
    app.start();
};