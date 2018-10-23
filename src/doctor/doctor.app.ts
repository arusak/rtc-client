import {BaseApp} from '../base/base.app';
import {DoctorView} from './doctor-view';
import {DoctorVideoConnector} from './doctor-video.connector';

export class DoctorApp extends BaseApp {
    constructor() {
        super('Doctor');
        this.VideoConnectorClass = DoctorVideoConnector;
        this.ViewClass = DoctorView;
        this.authParameters = {
            url: '/api/auth/login'
        };
    }
}