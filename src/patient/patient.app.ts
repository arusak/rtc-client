import {BaseApp} from '../base/base.app';
import {PatientView} from './patient-view';
import {PatientVideoStateService} from './patient-video-state.service';

export class PatientApp extends BaseApp {
    constructor() {
        super('Patient');
        this.VideoStateServiceClass = PatientVideoStateService;
        this.ViewClass = PatientView;
        this.authParameters = {
            url: '/api/patient/login'
        };
    }


}