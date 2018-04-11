import { hasWebsocketSupport, WebsocketHandlerService } from './websocket';
import { idbKeyVal, KEY_LATEST_MODIFICATION_HASH, KEY_LAST_UPDATE } from '../shared/idbKeyVal';
import { getRandomArbitrary } from '../shared/util';
import { Injectable } from '@angular/core';
import { ConnectivityService } from './connectivity';
import { WEEK_DAYS } from '../model/weekdays';
import { PlanFetcherService } from '../shared/services/plan-fetcher.service';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { AuthenticationProviderService } from 'app/shared/auth/auth-provider.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ModificationCheckerService {
    public readonly loadingPlans = new BehaviorSubject(false);

    public latestModificationHash: Promise<string>;
    public lastUpdate = new ReplaySubject<Date>(1);

    private lastPlanFetchedDate: Date = new Date(0);
    private checking = false;

    private unscheduleCheckModification = () => null;

    constructor(
        private connectivityService: ConnectivityService,
        private authenticationProvider: AuthenticationProviderService,
        private planFetcher: PlanFetcherService,
        private websocketHandler: WebsocketHandlerService) {
        this.setup();
    }

    private async setup() {
        // fetch from storage
        await this.updateHashAndValidate(true);
        try {
            await this.checkModificationHash();
        } finally {
            setInterval(this.updateHashAndValidate, 10 * 1000);
            window.addEventListener('focus', () => this.forceUpdate());
        }
    }

    private updateHashAndValidate = (skipValidate?: boolean) => {
        this.latestModificationHash = idbKeyVal.get(KEY_LATEST_MODIFICATION_HASH);
        const promise = idbKeyVal.get(KEY_LAST_UPDATE)
            .then((result) => {
                const date = new Date(<string>result);
                if (!isNaN(+date)) {
                    this.lastUpdate.next(date);
                }
            });
        if (!skipValidate) {
            this.validateModificationHash();
        }
        return Promise.all([this.latestModificationHash, promise]);
    }

    private async fetchModificationHash() {
        const url = window.location.origin + '/api/v1/plans/getModificationHash?' + await this.authenticationProvider.getQueryParam()
        const res = await fetch(url, {
            credentials: 'same-origin'
        });
        if (res.status === 401) {
            this.authenticationProvider.gotUnauthorized();
        }
        if (res.status < 200 || res.status >= 300) {
            throw new Error(res.url + ' ' + res.statusText);
        }
        const modificationHash = res.headers.get('etag');
        if (!modificationHash) {
            throw new Error('no etag header');
        }
        console.log('fetched modification hash ' + modificationHash);
        return this.gotModifiactionHash(modificationHash);
    }

    private checkModificationHash = async () => {
        if (this.checking) {
            return;
        }
        this.unscheduleCheckModification();
        this.checking = true;
        try {
            await this.connectivityService.executeLoadingTask(this.fetchModificationHash, this);
            // reschedule
            const handle = setTimeout(() => {
                if (hasWebsocketSupport) {
                    this.websocketHandler.connect();
                    return;
                }
                this.checkModificationHash();
            }, getRandomArbitrary(8000, 10000));
            this.unscheduleCheckModification = () => clearTimeout(handle);
        } catch (err) {
            console.log('Error in checkModificationRequest ' + err.toString());
            this.unscheduleCheckModification = this.connectivityService.scheduleRetryTask(this.checkModificationHash);
        } finally {
            this.checking = false;
        }
    }

    public forceUpdate() {
        this.updateHashAndValidate();
        this.checkModificationHash();
    }

    public async gotModifiactionHash(hash: string) {
        const now = new Date();
        await this.storeModifiactionHash(hash);
        await this.validateModificationHash();
        idbKeyVal.set(KEY_LAST_UPDATE, now.toUTCString());
        this.lastUpdate.next(now);
    }

    private async storeModifiactionHash(hash: string) {
        while (true) {
            this.latestModificationHash = idbKeyVal.get(KEY_LATEST_MODIFICATION_HASH);
            const expected = await this.latestModificationHash;
            if (expected === hash) {
                return;
            }
            if (await idbKeyVal.cas(KEY_LATEST_MODIFICATION_HASH, expected, hash)) {
                this.latestModificationHash = Promise.resolve(hash);
                return;
            }
        }
    }

    private async validateModificationHash() {
        const latestModificationHash = await this.latestModificationHash;
        if (!latestModificationHash) {
            console.log('validateModificationHash no hash set');
            this.checkModificationHash();
            return;
        }
        await this.planFetcher.syncKeyValue();
        const dates: Date[] = []
        for (let i = 0; i < WEEK_DAYS.length; i++) {
            const cacheValue = this.planFetcher.plansCache[WEEK_DAYS[i]].getValue();
            if (!cacheValue) {
                console.log('validateModificationHash not all plans Fetched');
                this.loadingPlans.next(true);
                return this.doFetchPlans(latestModificationHash);
            }
            dates[i] = cacheValue.modification;
        }
        const hash = this.calculateModificationHash(dates);
        if (latestModificationHash === hash) {
            //console.log('validateModificationHash unchanged', hash);
            this.loadingPlans.next(false);
            return;
        }
        if (this.lastPlanFetchedDate.getTime() + 5 * 1000 > Date.now()) {
            console.log('validateModificationHash other fetch not timed out');
            return;
        }
        console.log('validateModificationHash changed', latestModificationHash);
        this.loadingPlans.next(true);
        return this.doFetchPlans(latestModificationHash);
    }

    private calculateModificationHash(dates: Date[]) {
        const utcSeconds = dates.map((date) => date.getTime() / 1000);
        const hashNumbersCount = 2;
        const iterationsCount = 4;
        const hashNumbers: number[] = Array(hashNumbersCount).fill(0);
        let resultIndex = 0;
        for (let i = 0; i < iterationsCount; i++) {
            for (const secondsValue of utcSeconds) {
                // tslint:disable-next-line:no-bitwise
                const value = secondsValue >>> i * 6;
                hashNumbers[resultIndex] = (hashNumbers[resultIndex] * 31 + value) % Number.MAX_SAFE_INTEGER;
                resultIndex = (resultIndex + 1) % hashNumbersCount;
            }
        }
        const hash = hashNumbers
            .map((n) => n.toString(16).padStart(14, '0'))  // pad each to 14 chars
            .join('');
        return hash;
    }

    private async doFetchPlans(hash: string) {
        const oldDate = this.lastPlanFetchedDate;
        try {
            this.lastPlanFetchedDate = new Date();
            await this.authenticationProvider.whenAuthorized();
            const changed = await this.planFetcher.fetchAll();
            if (changed) {
                this.updateHashAndValidate();
            }
        } catch (err) {
            this.lastPlanFetchedDate = oldDate;
            throw err;
        }
    }
}
