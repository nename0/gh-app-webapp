import { ReplaySubject } from 'rxjs/ReplaySubject';
import { take, pairwise } from 'rxjs/operators';
import { combineLatest } from 'rxjs/operators/combineLatest';
import { hasWebsocketSupport, WebsocketHandlerService } from './websocket';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { idbKeyVal } from '../shared/idbKeyVal';
import { checkResponseStatus, getRandomArbitrary } from '../shared/util';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { ConnectivityService } from './connectivity';
import { PlanFetcherService } from './plan-fetcher';

const KEY_LAST_MODIFICATION_RECEIVED = 'lastModificationReceived';
const KEY_LAST_MODIFICATION_FETCHED = 'lastModificationFetched';
const KEY_LAST_UPDATE = 'lastUpdate';

@Injectable()
export class ModificationCheckerService {
    public lastModificationReceived: Promise<Date>;
    private lastModificationFetched: Promise<Date>;
    public lastUpdate = new ReplaySubject<Date>(1);

    private lastModificationFetching = new Date(-1);

    constructor(
        private connectivityService: ConnectivityService,
        private planFetcher: PlanFetcherService,
        private websocketHandler: WebsocketHandlerService) {
        this.setup();
    }

    private async setup() {
        // fetch from storage
        await this.syncKeyValue();

        this.checkModification();
    }

    private syncKeyValue() {
        async function doSync(key: string) {
            const result = await idbKeyVal.get(key);
            const date = new Date(<string>result);
            if (!isNaN(+date)) {
                return date;
            }
            idbKeyVal.set(key, new Date(0).toUTCString());
            return new Date(0);
        }
        this.lastModificationReceived = doSync(KEY_LAST_MODIFICATION_RECEIVED);
        this.lastModificationFetched = doSync(KEY_LAST_MODIFICATION_FETCHED);
        const promise = idbKeyVal.get(KEY_LAST_UPDATE)
            .then((result) => {
                const date = new Date(<string>result);
                if (!isNaN(+date)) {
                    this.lastUpdate.next(date);
                }
            });
        return Promise.all([this.lastModificationReceived, this.lastModificationFetched, promise]);
    }

    private async checkModificationRequest() {
        const res = await fetch(window.location.origin + '/api/v1/plans/getLatestModification', {
            credentials: 'same-origin'
        }).then(checkResponseStatus);
        const lastModificationStr = res.headers.get('last-modified');
        if (!lastModificationStr || isNaN(+new Date(lastModificationStr))) {
            throw new Error('no last-modified header');
        }
        console.log('fetched modification date ' + lastModificationStr);
        return this.gotModifiactionDate(new Date(lastModificationStr));
    }

    private checkModification = async () => {
        try {
            await this.connectivityService.executeLoadingTask(this.checkModificationRequest, this);
            setTimeout(() => {
                if (hasWebsocketSupport) {
                    this.websocketHandler.connect();
                    return;
                }
                this.checkModification();
            }, getRandomArbitrary(8000, 10000));
        } catch (err) {
            console.log('Error in checkModificationRequest', err);
            this.connectivityService.scheduleRetryTask(this.checkModification);
        }
    }

    private async storeModifiactionReceived(date: Date) {
        while (true) {
            const expected = await this.lastModificationReceived;
            if (expected >= date) {
                return expected;
            }
            if (await idbKeyVal.cas(KEY_LAST_MODIFICATION_RECEIVED, expected.toUTCString(), date.toUTCString())) {
                return date;
            }
            this.syncKeyValue();
        }
    }

    public async gotModifiactionDate(date: Date) {
        const now = new Date();
        date = await this.storeModifiactionReceived(date);
        await this.receivedModification(date);
        idbKeyVal.set(KEY_LAST_UPDATE, now.toUTCString());
        this.lastUpdate.next(now);
    }

    private receivedModification = async (lastModificationReceived: Date) => {
        while (true) {
            this.syncKeyValue();
            const lastModificationFetched = await this.lastModificationFetched;
            if (lastModificationFetched >= lastModificationReceived ||
                this.lastModificationFetching >= lastModificationReceived) {
                    console.log('lastModification unchanged ' + lastModificationReceived.toUTCString());
                return;
            }
            console.log('lastModification changed ' + lastModificationReceived.toUTCString() + ' fetching plans');
            this.lastModificationFetching = lastModificationReceived;
            await this.planFetcher.fetchAll();
            this.lastModificationFetching = new Date(-1);
            if (await idbKeyVal.cas(KEY_LAST_MODIFICATION_FETCHED, lastModificationFetched.toUTCString(), lastModificationReceived.toUTCString())) {
                return;
            }
        }
    }
}
