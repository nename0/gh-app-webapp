import { Injectable, Injector } from '@angular/core';
import { ConnectivityService } from './connectivity';
import { getRandomArbitrary, browserFingerprint } from '../shared/util';
import { WSMESSAGE_PUSH_SUBSCRIPTION, WSMESSAGE_MODIFICATION_HASH_UPDATE, WSMESSAGE_MODIFICATION_HASH_QUERY } from './websocket-mesages';
import { ModificationCheckerService } from './modification-checker';
import { filter, take } from 'rxjs/operators';
import { AuthenticationProviderService } from 'app/shared/auth/auth-provider.service';

export const hasWebsocketSupport = typeof WebSocket === 'function';

@Injectable()
export class WebsocketHandlerService {
    private readonly url: Promise<string>;

    private websocket: WebSocket;
    private lastReceiveTime: number;
    private pingCheckTimeout: number;

    private startedLoadingTask = false;

    private unscheduleConnect = () => null;

    // lazy getter
    private get modificationChecker(): ModificationCheckerService {
        Object.defineProperty(this, 'modificationChecker', { value: this.injector.get(ModificationCheckerService), writable: false, configurable: true })
        return this.modificationChecker;
    }

    constructor(private injector: Injector,
        private connectivityService: ConnectivityService,
        private authenticationProvider: AuthenticationProviderService) {
        if (hasWebsocketSupport) {
            this.url = browserFingerprint.then((fingerprint) =>
                location.origin.replace(/^http/, 'ws') + '/api/v1/websocket?fingerprint=' + fingerprint);
        }
    }

    // returns true when connecting
    public connect = async () => {
        await this.authenticationProvider.whenAuthorized();
        const url = await this.url;
        if (this.websocket && this.websocket.readyState <= WebSocket.OPEN) {
            return this.websocket.readyState === WebSocket.CONNECTING;
        }
        console.log('connecting websocket');
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
        if (data.startsWith(WSMESSAGE_MODIFICATION_HASH_UPDATE)) {
            const hash = data.slice(WSMESSAGE_MODIFICATION_HASH_UPDATE.length);
            this.modificationChecker.gotModifiactionHash(hash);
        }
    }

    private onerror = (event: Event) => {
        if (event.target !== this.websocket) {
            return;
        }
        console.log('websocket error');
        this.websocket.close();

    }

    private onclose = (event: Event) => {
        if (event.target !== this.websocket) {
            return;
        }
        this.networkNegative();
        this.unscheduleConnect();
        this.unscheduleConnect = this.connectivityService.scheduleRetryTask(this.connect);
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
        const hash = await this.modificationChecker.latestModificationHash;
        if (this.websocket.readyState === WebSocket.OPEN) {
            this.sendMessage(WSMESSAGE_MODIFICATION_HASH_QUERY + hash);
        }
    }

    public async sendPushSubscription(value: string) {
        if (await this.connect()) {
            // connecting
            while (this.startedLoadingTask) {
                await this.connectivityService.loading.pipe(filter((isLoading) => !isLoading), take(1)).toPromise();
            }
            if (this.websocket && this.websocket.readyState === WebSocket.CLOSED) {
                throw new Error('sendPushSubscription: websocket connection error');
            }
        }
        this.sendMessage(WSMESSAGE_PUSH_SUBSCRIPTION + value);
        while (this.startedLoadingTask) {
            await this.connectivityService.loading.pipe(filter((isLoading) => !isLoading), take(1)).toPromise();
        }
        if (this.websocket && this.websocket.readyState === WebSocket.CLOSED) {
            throw new Error('sendPushSubscription: websocket connection error');
        }
    }
}
