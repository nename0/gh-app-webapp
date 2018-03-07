import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable, NgZone } from '@angular/core';
import { hasWebsocketSupport, WebsocketHandlerService } from './websocket';
import { idbKeyVal } from '../shared/idbKeyVal';
import { RENEW_PERIOD_MILLIS } from '../shared/auth/auth-provider.service';
import { ConnectivityService } from './connectivity';
import { filter as rxFilter } from 'rxjs/operators';
import { FilterService } from '../shared/services/filter.service';

declare const navigator: Navigator;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const pushAvailable = 'serviceWorker' in navigator && 'PushManager' in window && hasWebsocketSupport;
const publicKey = 'BFnMFwGNZpptuw48WlgK1ae8k-t09c26C_Ssf04jmHKJfnMM26SLprWmnRr_z03MbYenDHlmsjsj_-0_T-O4U6M';
const KEY_LAST_PUSH_SUBSCRIPTION_VALUE = 'lastPushSubscriptionValue';
const KEY_LAST_PUSH_SUBSCRIPTION_DATE = 'lastPushSubscriptionDate';

@Injectable()
export class PushService {
    public readonly pushStatus: BehaviorSubject<PushStatus>;
    public readonly hasErrored = new BehaviorSubject(0);

    private lastPushSubscriptionDate: Promise<Date>;
    private lastPushSubscriptionValue: Promise<string>;

    private updatePromise: Promise<void>;

    constructor(private ngZone: NgZone,
        private websocketHandler: WebsocketHandlerService,
        private connectivityService: ConnectivityService,
        private filterService: FilterService) {
        if (!pushAvailable) {
            this.pushStatus = new BehaviorSubject(PushStatus.NOT_AVALABLE);

        } else {
            this.pushStatus = new BehaviorSubject(PushStatus.DISABLED);
            this.setup();
        }
    }

    private async setup() {
        if ('permissions' in navigator) {
            const notificationPermission = await (<any>navigator).permissions.query({
                name: 'notifications'
            });
            notificationPermission.onchange = (event) => {
                this.ngZone.run(() => {
                    console.log('permission change notification', event.currentTarget);
                    this.update();
                });
            };
        }
        await this.syncKeyValue();
        await this.update();
        this.filterService.selectedFilters.subscribe(this.update);
    }

    private syncKeyValue() {
        this.lastPushSubscriptionDate = idbKeyVal.get(KEY_LAST_PUSH_SUBSCRIPTION_DATE)
            .then((result) => {
                const date = new Date(<string>result);
                if (!isNaN(+date)) {
                    return date;
                }
                idbKeyVal.set(KEY_LAST_PUSH_SUBSCRIPTION_DATE, new Date(0).toUTCString());
                return new Date(0);
            });
        this.lastPushSubscriptionValue = idbKeyVal.get(KEY_LAST_PUSH_SUBSCRIPTION_VALUE)
        return Promise.all([this.lastPushSubscriptionDate, this.lastPushSubscriptionValue]);
    }

    // lazy getter
    private async getPushManager(): Promise<PushManager> {
        const swRegistration = await navigator.serviceWorker.ready;
        const pushManager = swRegistration.pushManager;
        Object.defineProperty(this, 'getPushManager', { value() { return pushManager; }, configurable: true, writable: false });
        return this.getPushManager();
    }

    private update = async () => {
        if (this.updatePromise) {
            return this.updatePromise;
        }
        try {
            this.updatePromise = this.doUpdate();
            await this.updatePromise;
        } finally {
            this.updatePromise = null;
        }
    }

    private async doUpdate() {
        if ((<any>Notification).permission === 'denied') {
            this.pushStatus.next(PushStatus.DENIED);
            await this.updateSubscriptionOnServer(null);
            return;
        }

        const pushManager = await this.getPushManager();
        const subscription = await pushManager.getSubscription();
        if (!subscription) {
            this.hasErrored.next(0);
            this.pushStatus.next(PushStatus.DISABLED);
        }
        try {
            //TODO set correct filter
            await this.updateSubscriptionOnServer(subscription);
            if (subscription) {
                this.hasErrored.next(0);
                this.pushStatus.next(PushStatus.ENABLED);
            }
        } catch (err) {
            if (subscription) {
                this.hasErrored.next(1);
            }
            console.log('error in updateSubscriptionOnServer ' + err.toString());
            this.connectivityService.scheduleRetryTask(this.update);
        }
    }

    private async subscribeUser() {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        try {
            const pushManager = await this.getPushManager();
            await pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });
        } catch (err) {
            console.log('Failed to subscribe the user: ', err);
            this.hasErrored.next(2);
            return;
        }
        await this.update();
    }

    private async unsubscribeUser() {
        try {
            const pushManager = await this.getPushManager();
            const subscription = await pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
        } catch (err) {
            console.log('Failed to unsubscribe the user: ', err);
        }
        await this.update();
    }

    public async toggle() {
        if (this.pushStatus.getValue() === PushStatus.ENABLED) {
            await this.unsubscribeUser();
        } else {
            await this.subscribeUser();
        }
    }

    private async updateSubscriptionOnServer(subscription: PushSubscription) {
        let value;
        if (!subscription) {
            value = JSON.stringify(null);
        } else {
            const filter = this.filterService.selectedFilters.getValue();
            // we cannot add a property on PushSubscription directly because it has a toJSON function
            subscription = JSON.parse(JSON.stringify(subscription));
            subscription['filter'] = filter.length ? filter : null;
            value = JSON.stringify(subscription);
        }
        const date = new Date();
        while (true) {
            this.syncKeyValue();
            const cacheValue = await this.lastPushSubscriptionValue;
            const cacheDate = await this.lastPushSubscriptionDate;
            if (cacheValue === value && (+cacheDate + RENEW_PERIOD_MILLIS) > Date.now()) {
                console.log('subscribtion unchanged', JSON.stringify(subscription));
                return;
            }
            await this.websocketHandler.sendPushSubscription(value);
            if (await idbKeyVal.cas(KEY_LAST_PUSH_SUBSCRIPTION_DATE, cacheDate.toUTCString(), date.toUTCString())) {
                await idbKeyVal.set(KEY_LAST_PUSH_SUBSCRIPTION_VALUE, value);
                console.log('subscribtion changed to', JSON.stringify(subscription));
                return;
            }
        }
    }
}

export enum PushStatus {
    NOT_AVALABLE,
    DISABLED,
    ENABLED,
    DENIED
}
