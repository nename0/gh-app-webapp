import { SwMessage } from './serviceworker-messages';
import { Observable } from 'rxjs/Observable';
import { never } from 'rxjs/observable/never';

let serviceWorker: ServiceWorker;
let serviceWorkerPromise;
if (window.navigator.serviceWorker) {
    serviceWorkerPromise = window.navigator.serviceWorker.ready.then((registration) => {
        serviceWorker = registration.active;
        registration.addEventListener('message', (event) => {
            if (event.source === serviceWorker) {
                onGlobaMessage({ msg: event.data.msg }, event.data.data, event.ports[0]);
            }
        });
        return registration.active;
    });
}

function msgToWorker<Req, Res>(msg: SwMessage<Req, Res>, data: Req): MessagePort {
    const channel = new MessageChannel();
    serviceWorker.postMessage({
        msg: msg.msg,
        data
    }, [channel.port2]);
    return channel.port1;
}

function onGlobaMessage<Req, Res>(msg: SwMessage<Req, Res>, data: Res, port: MessagePort) {
    switch (msg) {

    }
}

export function serviceWorkerObservable<Req, Res>(msg: SwMessage<Req, Res>, data: Req): Observable<Res> {
    if (!window.navigator.serviceWorker) {
        return never();
    }
    return new Observable(function(subscriber) {
        serviceWorkerPromise.then(() => {
            if (subscriber.closed) {
                return;
            }
            const port = msgToWorker(msg, data);
            subscriber.add(() => {
                port.postMessage({ unsubscribe: true });
            });
            port.onmessage = function(event) {
                if (subscriber.closed) {
                    return;
                }
                const res = event.data;
                if (res.error) {
                    subscriber.error(res.error);
                    port.close();
                } else if (res.complete) {
                    subscriber.complete();
                    port.close();
                } else {
                    subscriber.next(res.next);
                }
            }
        });
    });
}
