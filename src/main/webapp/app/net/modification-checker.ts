import { ReplaySubject } from 'rxjs/ReplaySubject';
import { take, pairwise } from 'rxjs/operators';
import { combineLatest } from 'rxjs/operators/combineLatest';
import { Connectivity } from './connectivity';
import { hasWebsocketSupport } from './websocket';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { idbKeyVal } from '../shared/idbKeyVal';
import { checkResponseStatus, getRandomArbitrary } from '../shared/util';

const KEY_LAST_MODIFICATION = 'lastModification';

class ModificationCheckerClass {
    public lastModification: Promise<Date>;

    constructor() {
        this.setup();
    }

    private async setup() {
        // fetch from storage
        await this.syncKeyValue();

        this.checkModification();
    }

    private syncKeyValue() {
        const promise = (async () => {
            while (true) {
                const result = await idbKeyVal.get(KEY_LAST_MODIFICATION);
                const date = new Date(<string>result);
                if (!isNaN(+date)) {
                    return date;
                }
                if (await idbKeyVal.cas(KEY_LAST_MODIFICATION, result, new Date(0).toUTCString())) {
                    return new Date(0);
                }
            }
        })();
        this.lastModification = promise;
        return promise;
    }

    private async checkModificationRequest() {
        const res = await fetch(window.location.origin + '/api/v1/plans/getLatestModification', {
            credentials: 'same-origin'
        }).then(checkResponseStatus);
        const lastModificationStr = res.headers.get('last-modified');
        if (!lastModificationStr || isNaN(+new Date(lastModificationStr))) {
            throw new Error('no last-modified header');
        }
        return this.gotModifiactionDate(new Date(lastModificationStr));
    }

    private checkModification = async () => {
        try {
            await this.checkModificationRequest();
            Connectivity.hintOnline();
            if (hasWebsocketSupport) {
                //setupWebsocket();
                return;
            }
            setTimeout(() => {
                this.checkModification();
            }, getRandomArbitrary(8000, 10000));

        } catch (err) {
            console.log('Error in checkModificationRequest', err);
            Connectivity.hintOffline();
            setTimeout(() => {
                this.checkModification();
            }, getRandomArbitrary(1000, 4000));
        }
    }

    private async casModifiactionDate(date: Date) {
        while (true) {
            const expected = await this.lastModification;
            if (expected >= date) {
                return expected;
            }
            if (await idbKeyVal.cas(KEY_LAST_MODIFICATION, expected.toUTCString(), date.toUTCString())) {
                return date;
            }
            this.syncKeyValue();
        }
    }

    public async gotModifiactionDate(date: Date) {
        this.onModification(await this.casModifiactionDate(date));
    }

    private onModification = async (lastModification: Date) => {
        
    }
}

export const ModificationChecker = new ModificationCheckerClass();
