import {Observable, Observer, Subject} from 'rxjs';

export class WebSocketConnection {
    data$: Observable<MessageEvent>;

    private url: string;
    private ws: WebSocket;
    private sendBuffer: any[] = [];
    private observer: Observer<MessageEvent>;

    constructor() {
        let subj: Subject<MessageEvent> = new Subject();
        this.observer = subj;
        this.data$ = subj.asObservable();
    }

    send(data: any) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.log('<<<', data);
            this.ws.send(JSON.stringify(data));
        } else {
            this.log('[BUFFER]', data);
            this.sendBuffer.push(data);
        }
    }

    close() {
        this.sendBuffer = [];
        this.ws.close();
    }

    connect(url: string):Promise<any> {
        this.url = url;

        this.log(`Соединяемся...`);
        this.ws = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/ws/${this.url}`);

        let promise = new Promise(resolve => {
            this.ws.onopen = () => {
                this.log('Вебсокет открыт');

                while (this.sendBuffer.length > 0) {
                    this.send(this.sendBuffer.shift());
                }
            };
        });

        this.ws.onerror = err => {
            this.log('Ошибка в вебсокете', err);
        };

        this.ws.onmessage = msg => {
            this.observer.next(msg);
        };

        this.ws.onclose = (event: CloseEvent) => {
            this.observer.complete();
        };

        window.addEventListener('beforeunload', () => this.ws.close(), false);

        return promise;
    }

    private log(...messages) {
        messages = messages.map(msg => {
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            return msg;
        });
        console.log(`%c${messages.join(' ')}`, 'color: #ccc');
    }
}
