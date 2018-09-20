import 'webrtc-adapter';
import '../style.less';
import {DoctorApp} from './doctor.app';

window.onload = () => {
    let app = new DoctorApp();
    app.start();
};