import { Injectable, Injector } from '@angular/core';
import { ConnectivityService } from './connectivity';
import { getRandomArbitrary } from '../shared/util';
import { WSMESSAGE_LAST_MODIFICATION_QUERY, WSMESSAGE_LAST_MODIFICATION_UPDATE } from './websocket-mesages';
import { ModificationCheckerService } from './modification-checker';

export const hasWebsocketSupport = typeof WebSocket === 'function';

@Injectable()
export class WebsocketHandlerService {
    private readonly url: string;

    private websocket: WebSocket;
    private lastReceiveTime: number;
    private pingCheckTimeout: number;

    private startedLoadingTask = false;

    private get modificationChecker() {
        return this.injector.get(ModificationCheckerService);
    }

    constructor(private injector: Injector,
        private connectivityService: ConnectivityService) {
        if (hasWebsocketSupport) {
            this.url = location.origin.replace(/^http/, 'ws') + '/api/v1/websocket';
        }
    }

    public connect = () => {
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
        this.websocket = new WebSocket(this.url);
        this.websocket.onopen = this.onopen;
        this.websocket.onmessage = this.onmessage;
        this.websocket.onerror = this.onerror;
        this.websocket.onclose = this.onclose;
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
        if (data.startsWith(WSMESSAGE_LAST_MODIFICATION_UPDATE)) {
            const date = new Date(data.slice(WSMESSAGE_LAST_MODIFICATION_UPDATE.length));
            this.modificationChecker.gotModifiactionDate(date);
        }
        console.log('ws from server', data);
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
        setTimeout(this.connect, getRandomArbitrary(1000, 3000));
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
            this.websocket.send(WSMESSAGE_LAST_MODIFICATION_QUERY + date.toUTCString());
        }
    }
}
