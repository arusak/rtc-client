export class LoginSession {
    constructor(private url: string, private username: string, private password: string) {
    }

    auth(): Promise<any> {
        // Default options are marked with *
        return fetch(this.url, {
            method: 'POST',
            //mode: "cors", // no-cors, cors, *same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            //credentials: "same-origin", // include, same-origin, *omit
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify({
                username: this.username, password: this.password, deviceType: 'BROWSER'
            }), // body data type must match "Content-Type" header
        })
            .then(response => response.json()) // parses response to JSON
            .catch(error => console.error(`Fetch Error =\n`, error));

    };
}
