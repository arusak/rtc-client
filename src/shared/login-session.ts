import {AuthParameters} from '../base/interfaces/auth-parameters.interface';

export class LoginSession {
    constructor() {
    }

    check(): Promise<string> {
        return fetch('/api/auth/person', {credentials: 'same-origin'})
            .then(response => response.json())
            .then(result => {
                return result.username;
            });
    }

    auth(params: AuthParameters): Promise<any> {
        // Default options are marked with *
        return fetch(params.url, {
            method: 'POST',
            //mode: "cors", // no-cors, cors, *same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, same-origin, *omit
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify({
                username: params.username, password: params.password, deviceType: 'BROWSER'
            }), // body data type must match "Content-Type" header
        })
            .then(response => response.json()) // parses response to JSON
            .catch(error => console.error(`Fetch Error =\n`, error));

    }
}
