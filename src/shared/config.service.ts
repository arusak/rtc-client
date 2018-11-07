import {ajax, AjaxResponse} from 'rxjs/ajax';
import {map} from 'rxjs/operators';

export class ConfigService {
    rtcConfig: RTCConfiguration;

    constructor(){
        this.prepareRtcConfig();
    }

    prepareRtcConfig() {
        ajax('/api/systeminfo')
            .pipe(map((resp: AjaxResponse) => resp.response))
            .subscribe((systemInfo: { key: string, value: string }[]) => {
                this.rtcConfig = {
                    iceTransportPolicy: 'relay',
                    iceServers: [{
                        urls: systemInfo.find(param => param.key === 'RTC_TURN_URL').value,
                        username: systemInfo.find(param => param.key === 'RTC_TURN_LOGIN').value,
                        credential: systemInfo.find(param => param.key === 'RTC_TURN_PASSWORD').value,
                    }]
                };
            });
    }

    private log(...messages) {
        let text = messages.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg).join(' ');
        console.log(`%c[CONFIG] ${text}`, 'color: #b0b');
    }

}