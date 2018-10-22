import {BaseApp} from '../base/base.app';
import {PatientView} from './patient-view';
import {PatientVideoConnector} from './patient-video.connector';
import {PatientVideoStateService} from './patient-video-state.service';

export class PatientApp extends BaseApp {
    constructor() {
        super('Patient');
        this.VideoConnectorClass = PatientVideoConnector;
        this.ViewClass = PatientView;
        this.authParameters = {
            url: '/api/patient/login', username: 'slukov', password: 'slukov'
        };
    }


}