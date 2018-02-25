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
import { WEEK_DAYS } from '../model/weekdays';

const KEY_LATEST_MODIFICATION_HASH = 'latestModificationHash';
const KEY_LAST_UPDATE = 'lastUpdate';

@Injectable()
export class ModificationCheckerService {
    public latestModificationHash: Promise<string>;
    private modificationHashFetching: string;
    public lastUpdate = new ReplaySubject<Date>(1);

    private unscheduleCheckModification = () => null;

    constructor(
        private connectivityService: ConnectivityService,
        private planFetcher: PlanFetcherService,
        private websocketHandler: WebsocketHandlerService) {
        this.setup();
    }

    private async setup() {
        // fetch from storage
        await this.update();
        try {
            await this.checkModification();
        } finally {
            setInterval(this.update, 10 * 1000)
        }
    }

    private update = () => {
        this.latestModificationHash = idbKeyVal.get(KEY_LATEST_MODIFICATION_HASH);
        this.validateModificationHash();
        const promise = idbKeyVal.get(KEY_LAST_UPDATE)
            .then((result) => {
                const date = new Date(<string>result);
                if (!isNaN(+date)) {
                    this.lastUpdate.next(date);
                }
            });
        return Promise.all([this.latestModificationHash, promise]);
    }

    private async checkModificationRequest() {
        const res = await fetch(window.location.origin + '/api/v1/plans/getModificationHash', {
            credentials: 'same-origin'
        }).then(checkResponseStatus);
        const modificationHash = res.headers.get('etag');
        if (!modificationHash) {
            throw new Error('no etag header');
        }
        console.log('fetched modification hash ' + modificationHash);
        return this.gotModifiactionHash(modificationHash);
    }

    public checkModification = async () => {
        try {
            await this.connectivityService.executeLoadingTask(this.checkModificationRequest, this);
            this.unscheduleCheckModification();
            // reschedule
            const handle = setTimeout(() => {
                if (hasWebsocketSupport) {
                    this.websocketHandler.connect();
                    return;
                }
                this.checkModification();
            }, getRandomArbitrary(8000, 10000));
            this.unscheduleCheckModification = () => clearTimeout(handle);
        } catch (err) {
            console.log('Error in checkModificationRequest' + err.toString());
            this.unscheduleCheckModification = this.connectivityService.scheduleRetryTask(this.checkModification);
        }
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
            const expected = await this.latestModificationHash;
            if (expected === hash) {
                return;
            }
            if (await idbKeyVal.cas(KEY_LATEST_MODIFICATION_HASH, expected, hash)) {
                this.latestModificationHash = Promise.resolve(hash);
                return;
            }
            this.latestModificationHash = idbKeyVal.get(KEY_LATEST_MODIFICATION_HASH);
        }
    }

    private async validateModificationHash() {
        const latestModificationHash = await this.latestModificationHash;
        if (!latestModificationHash) {
            console.log('validateModificationHash no hash set');
            return;
        }
        if (this.modificationHashFetching === latestModificationHash) {
            console.log('validateModificationHash other fetch ongoing');
            return;
        }
        const dates: Date[] = []
        for (let i = 0; i < WEEK_DAYS.length; i++) {
            const cacheValue = this.planFetcher.plansCache[WEEK_DAYS[i]].getValue();
            if (!cacheValue) {
                console.log('validateModificationHash not all plans Fetched');
                return this.doFetchPlans(latestModificationHash);
            }
            dates[i] = cacheValue.modification;
        }
        const hash = await this.calculateModificationHash(dates);
        if (latestModificationHash === hash) {
            //console.log('validateModificationHash unchanged', hash);
            return;
        }
        console.log('validateModificationHash changed', hash);
        return this.doFetchPlans(latestModificationHash);
    }

    private async calculateModificationHash(dates: Date[]) {
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
        try {
            this.modificationHashFetching = hash;
            const changed = await this.planFetcher.fetchAll();
            if (changed) {
                this.update();
            }
        } finally {
            this.modificationHashFetching = null;
        }
    }
}
