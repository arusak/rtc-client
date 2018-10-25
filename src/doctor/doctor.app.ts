import {BaseApp} from '../base/base.app';
import {DoctorView} from './doctor-view';
import {DoctorVideoConnector} from './doctor-video.connector';
import {DoctorVideoStateService} from './doctor-video-state.service';

export class DoctorApp extends BaseApp {
    constructor() {
        super('Doctor');
        this.VideoStateServiceClass = DoctorVideoStateService;
        this.VideoConnectorClass = DoctorVideoConnector;
        this.ViewClass = DoctorView;
        this.authParameters = {
            url: '/api/auth/login'
        };
    }
}