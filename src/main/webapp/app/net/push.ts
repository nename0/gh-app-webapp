import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable, NgZone } from '@angular/core';
import { idbKeyVal } from '../shared/idbKeyVal';
import { checkResponseStatus } from '../shared/util';
import { hasWebsocketSupport } from './websocket';

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
const KEY_BROWSER_FINGERPRINT = 'browserFingerprint';

@Injectable()
export class PushService {
    public readonly pushStatus: BehaviorSubject<PushStatus>;

    private swRegistration: ServiceWorkerRegistration;
    private browserFingerprint: string;

    private lastPushSubscriptionDate: Promise<Date>;
    private lastPushSubscriptionValue: Promise<string>;

    constructor(private ngZone: NgZone) {
        if (!pushAvailable) {
            this.pushStatus = new BehaviorSubject(PushStatus.NOT_AVALABLE);

        } else {
            this.pushStatus = new BehaviorSubject(PushStatus.DISABLED);
            this.setup();
        }
    }

    private async setup() {
        this.swRegistration = await navigator.serviceWorker.ready;
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
        await this.setupBrowserFingerprint();
        await this.syncKeyValue();
        await this.update();
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

    private async update() {
        if ((<any>Notification).permission === 'denied') {
            this.pushStatus.next(PushStatus.DENIED);
            this.updateSubscriptionOnServer(null);
            return;
        }

        const subscription = await this.swRegistration.pushManager.getSubscription();
        await this.updateSubscriptionOnServer(subscription);
        if (subscription) {
            this.pushStatus.next(PushStatus.ENABLED);
        } else {
            this.pushStatus.next(PushStatus.DISABLED);
        }
    }

    private async subscribeUser() {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        try {
            await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });
        } catch (err) {
            console.log('Failed to subscribe the user: ', err);
        }
        await this.update();
    }

    private async unsubscribeUser() {
        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
        } catch (error) {
            console.log('Error unsubscribing', error);
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
        const value = subscription ? JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.getKey('p256dh'),
                auth: subscription.getKey('auth')
            }
        }) : null;
        const date = new Date();
        while (true) {
            this.syncKeyValue();
            const cacheValue = await this.lastPushSubscriptionValue;
            const cacheDate = await this.lastPushSubscriptionDate;
            if (cacheValue === value && (+cacheDate + 7 * 24 * 3600 * 1000) > Date.now()) {
                console.log('subscribtion unchanged', JSON.stringify(subscription));
                return;
            }
            if (value) {
                await fetch(window.location.origin + '/api/v1/pushSubscription?id=' + this.browserFingerprint, {
                    method: 'PUT',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: value
                }).then(checkResponseStatus);
            } else {
                await fetch(window.location.origin + '/api/v1/pushSubscription?id=' + this.browserFingerprint, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                }).then(checkResponseStatus);
            }
            if (await idbKeyVal.cas(KEY_LAST_PUSH_SUBSCRIPTION_DATE, cacheDate.toUTCString(), date.toUTCString())) {
                await idbKeyVal.set(KEY_LAST_PUSH_SUBSCRIPTION_VALUE, value);
                console.log('subscribtion changed to', JSON.stringify(subscription));
            }
        }
    }

    private async setupBrowserFingerprint() {
        function genFinerprint() {
            const baseString = Array(4).fill(0).map(() => Math.random()).toString() + navigator.userAgent;
            const resultNumbers = baseString.split('').reduce((array, char, index) => {
                index = index % 4;
                // tslint:disable-next-line:no-bitwise
                array[index] = (array[index] * 31) | 0 + char.charCodeAt(0);
                return array;
            }, [0, 0, 0, 0]);
            return resultNumbers.map((n) => n.toString(16)).join('');
        }
        while (true) {
            this.browserFingerprint = await idbKeyVal.get(KEY_BROWSER_FINGERPRINT);
            if (this.browserFingerprint) {
                break;
            }
            this.browserFingerprint = genFinerprint();
            if (await idbKeyVal.cas(KEY_BROWSER_FINGERPRINT, undefined, this.browserFingerprint)) {
                console.log('browser fingerprint set to', this.browserFingerprint);
                break;
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
