
import { SwMessage, MSG_GET_USER, MSG_LOGIN, MSG_LOGOUT } from './serviceworker-messages';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { AuthenticationProvider } from '../auth/auth-priovider';
import { from as Observable_from } from 'rxjs/observable/from';

declare const self: ServiceWorkerGlobalScope;

const activeClients: { [id: string]: ActiveClient } = Object.create(null);

const msgHandlers: { [msg: string]: (data, client: ActiveClient) => Observable<any> } = Object.create(null);

function addMessageHandler<Req, Res>(msg: SwMessage<Req, any>, handler: (data: Req, client: ActiveClient) => Observable<Res>) {
    msgHandlers[msg.msg] = handler;
}

function onmessage<Req, Res>(event: MessageEvent) {
    if (!(event.source instanceof WindowClient)) {
        return;
    }
    const port = event.ports[0];
    let client = activeClients[event.source.id];
    if (!client) {
        client = activeClients[event.source.id] = new ActiveClient();
    }
    let obs: Observable<Res> = msgHandlers[event.data.msg](event.data.data, client);
    if (!obs) {
        return;
    }
    obs = client.wrapObservable(obs);
    const subscription = obs.subscribe(
        (next) => port.postMessage({ next }),
        (error) => port.postMessage({ error: error.toString() }),
        () => port.postMessage({ complete: true }));
    if (subscription.closed) {
        return;
    }
    port.onmessage = function(unsubEvent: MessageEvent) {
        if (!unsubEvent.data.unsubscribe) {
            throw new Error('Invalid message on MessagePort');
        }
        subscription.unsubscribe();
        port.close();
    }
}

function checkClients() {
    self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        for (const clientId in activeClients) {
            if (!clients.some((client) => clientId === client.id)) {
                console.log('[Service Worker] Client gone', clientId);
                activeClients[clientId].clientGone();
                delete activeClients[clientId];
            }
        }
    });
}

class ActiveClient {
    subscriptions: Subscription[] = [];

    clientGone() {
        const array = this.subscriptions;
        this.subscriptions = [];
        for (const key in array) {
            if (array.hasOwnProperty(key)) {
                array[key].unsubscribe();
            }
        }
        if (this.subscriptions.length) {
            throw new Error('ActiveClient: during clearing of subscriptions another was added!');
        }
    }

    wrapObservable<T>(obs: Observable<T>): Observable<T> {
        return new Observable((subscriber) => {
            const index = this.subscriptions.length;
            this.subscriptions[index] = subscriber;
            this.subscriptions.length++;
            subscriber.add(() => {
                delete this.subscriptions[index];
            });
            obs.subscribe(subscriber);
        });
    }
}

export function startupSWMessaging() {
    addMessageHandler(MSG_GET_USER, () => AuthenticationProvider.userSubject);
    addMessageHandler(MSG_LOGIN, (credentials) => Observable_from(AuthenticationProvider.login(credentials)));
    addMessageHandler(MSG_LOGOUT, () => Observable_from(AuthenticationProvider.logout()));

    self.addEventListener('message', onmessage);
    setInterval(checkClients, 3000);
}
