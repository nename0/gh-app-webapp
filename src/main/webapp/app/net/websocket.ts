import { Injectable, Injector } from '@angular/core';
import { ConnectivityService } from './connectivity';
import { getRandomArbitrary, browserFingerprint } from '../shared/util';
import { WSMESSAGE_LAST_MODIFICATION_QUERY, WSMESSAGE_LAST_MODIFICATION_UPDATE, WSMESSAGE_PUSH_SUBSCRIPTION } from './websocket-mesages';
import { ModificationCheckerService } from './modification-checker';
import { filter, take } from 'rxjs/operators';

export const hasWebsocketSupport = typeof WebSocket === 'function';

@Injectable()
export class WebsocketHandlerService {
    private readonly url: Promise<string>;

    private websocket: WebSocket;
    private lastReceiveTime: number;
    private pingCheckTimeout: number;

    private startedLoadingTask = false;
    private pushSubscriptionToSend: string;

    // lazy getter
    private get modificationChecker(): ModificationCheckerService {
        Object.defineProperty(this, 'modificationChecker', { value: this.injector.get(ModificationCheckerService), writable: false, configurable: true })
        return this.modificationChecker;
    }

    constructor(private injector: Injector,
        private connectivityService: ConnectivityService) {
        if (hasWebsocketSupport) {
            this.url = browserFingerprint.then((fingerprint) =>
                location.origin.replace(/^http/, 'ws') + '/api/v1/websocket?fingerprint=' + fingerprint);
        }
    }

    // returns true when connecting
    public connect = async () => {
        const url = await this.url;
        if (this.websocket && this.websocket.readyState <= WebSocket.OPEN) {
            return this.websocket.readyState === WebSocket.CONNECTING;
        }
        if (this.websocket) {
            if (this.pingCheckTimeout) {
                clearTimeout(this.pingCheckTimeout);
            }
            const old = this.websocket;
            this.websocket = null;
            old.close();
        }
        if (!this.startedLoadingTask) {
            this.startedLoadingTask = true;
            this.connectivityService.startLoadingTask();
        }
        this.websocket = new WebSocket(url);
        this.websocket.onopen = this.onopen;
        this.websocket.onmessage = this.onmessage;
        this.websocket.onerror = this.onerror;
        this.websocket.onclose = this.onclose;
        return true;
    }

    private onopen = (event: Event) => {
        if (event.target !== this.websocket) {
            return;
        }
        this.networkPositive();
        this.trySendPushSubscription()
        this.forceUpdate();
    }

    private onmessage = (event: MessageEvent) => {
        if (event.target !== this.websocket) {
            return;
        }
        this.networkPositive();
        const data = event.data;
        if (data === '') {
            return;
        }
        console.log('ws from server', data);
        if (data.startsWith(WSMESSAGE_LAST_MODIFICATION_UPDATE)) {
            const date = new Date(data.slice(WSMESSAGE_LAST_MODIFICATION_UPDATE.length));
            this.modificationChecker.gotModifiactionDate(date);
        }
    }

    private onerror = (event: Event) => {
        if (event.target !== this.websocket) {
            return;
        }
        console.log('websocket error', event);
        this.websocket.close();

    }

    private onclose = (event: Event) => {
        if (event.target !== this.websocket) {
            return;
        }
        this.networkNegative();
        this.connectivityService.scheduleRetryTask(this.connect);
    }

    private networkPositive() {
        this.lastReceiveTime = Date.now();
        this.schedulePingCheck();
        if (this.startedLoadingTask) {
            this.startedLoadingTask = false;
            this.connectivityService.endLoadingTask();
        }
        this.connectivityService.hintOnline();
    }

    private networkNegative() {
        if (this.startedLoadingTask) {
            this.startedLoadingTask = false;
            this.connectivityService.endLoadingTask();
        }
        this.connectivityService.hintOffline();
    }

    private sendMessage(message: string) {
        if (!this.startedLoadingTask) {
            this.startedLoadingTask = true;
            this.connectivityService.startLoadingTask();
        }
        this.websocket.send(message);
    }

    private schedulePingCheck = () => {
        if (this.pingCheckTimeout) {
            clearTimeout(this.pingCheckTimeout);
        }
        const diff = Date.now() - this.lastReceiveTime;
        if (diff < 1000) {
            this.pingCheckTimeout = setTimeout(this.pingCheck, getRandomArbitrary(30000, 32000));
        } else if (diff < 55 * 1000) {
            this.pingCheckTimeout = setTimeout(this.pingCheck, getRandomArbitrary(5000, 6000));
        } else {
            console.log('weboscket timeout');
            this.websocket.close();
        }
    }

    private pingCheck = () => {
        if (this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send('');
            this.schedulePingCheck();
        }
    }

    public async forceUpdate() {
        const date = await this.modificationChecker.lastModificationReceived;
        if (this.websocket.readyState === WebSocket.OPEN) {
            this.sendMessage(WSMESSAGE_LAST_MODIFICATION_QUERY + date.toUTCString());
        }
    }

    public async sendPushSubscription(value: string) {
        this.pushSubscriptionToSend = value;
        await this.trySendPushSubscription();
        do {
            await this.connectivityService.loading.pipe(filter((isLoading) => !isLoading), take(1)).toPromise();
            if (this.websocket && this.websocket.readyState === WebSocket.CLOSED) {
                throw new Error('sendPushSubscription: websocket connection error');
            }
        } while (this.pushSubscriptionToSend);
    }

    private async trySendPushSubscription() {
        if (!this.pushSubscriptionToSend) {
            return;
        }
        if (await this.connect()) {
            return; // waiting for onopen
        }
        this.sendMessage(WSMESSAGE_PUSH_SUBSCRIPTION + this.pushSubscriptionToSend);
        this.pushSubscriptionToSend = null;
    }
}
