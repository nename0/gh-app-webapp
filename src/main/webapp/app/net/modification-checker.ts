import * as idbKeyVal from 'idb-keyval';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { filter, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs/operators/combineLatest';
import { Connectivity } from './connectivity';
import { getRandomArbitrary } from '../shared/random';

const KEY_LAST_MODIFICATION_RECEIVED = 'lastModificationReveived';
const KEY_LAST_MODIFICATION_FETCHED = 'lastModificationFetched';

function checkStatus(res: Response) {
    if (res.status >= 200 && res.status < 300) {
        return res;
    } else {
        throw new Error(res.url + ' ' + res.statusText);
    }
}

class ModificationCheckerClass {
    private readonly lastModificationReveived = new ReplaySubject<Date>(1);
    private readonly lastModificationFetched = new ReplaySubject<Date>(1);


    constructor() {
        this.setup();
    }

    private async setup() {
        // fetch from storage
        const [lMR, lMF] = await Promise.all([idbKeyVal.get(KEY_LAST_MODIFICATION_RECEIVED),
        idbKeyVal.get(KEY_LAST_MODIFICATION_FETCHED)]);
        let lMRDate = new Date(<string>lMR);
        lMRDate = isNaN(+lMRDate) ? new Date(0) : lMRDate;
        this.lastModificationReveived.next(lMRDate);
        let lMFDate = new Date(<string>lMF);
        lMFDate = isNaN(+lMFDate) ? new Date(0) : lMFDate;
        this.lastModificationFetched.next(lMFDate);
        // store on change
        this.lastModificationReveived.pipe(filter((date) => date !== lMRDate))
            .subscribe((date) => idbKeyVal.set(KEY_LAST_MODIFICATION_RECEIVED, date.toUTCString()));
        this.lastModificationFetched.pipe(filter((date) => date !== lMFDate))
            .subscribe((date) => idbKeyVal.set(KEY_LAST_MODIFICATION_FETCHED, date.toUTCString()));
        
        this.lastModificationReveived.pipe(combineLatest(this.lastModificationFetched)).subscribe(this.onModification);
        
        await this.checkModificationRequest();
        if (!this.hasWebsocketSupport()) {
            this.scheduleModificationCheck()
            return;
        }
        setupWebsocket();
    }

    private onModification = ([lastModificationReveived, lastModificationFetched]: [Date, Date]) => {

    }

    private async checkModificationRequest() {
        try {
            const res = await fetch(window.location.origin + ' /api/v1/plans/getLatestModification', {
                credentials: 'same-origin'
            }).then(checkStatus);
            const lastModificationStr = res.headers.get('last-modified');
            if (!lastModificationStr) {
                throw new Error('no last-modified header');
            }
            const lastModificationRes = new Date(lastModificationStr);
            const lastModificationFetched = await this.lastModificationFetched.pipe(take(1)).toPromise();
            if (lastModificationFetched >= lastModificationRes) {
                return lastModificationFetched;
            }
            this.lastModificationFetched.next(lastModificationRes);
            return lastModificationRes;
        } catch (err) {
            console.log('Error in checkModificationRequest', err);
            Connectivity.hintOffline();
        }
    }

    private scheduleModificationCheck(){
        setTimeout(() => {
            this.checkModificationRequest()
            this.scheduleModificationCheck();
        }, getRandomArbitrary(8000, 10000));
    }

    private hasWebsocketSupport() {
        return typeof WebSocket === 'function';
    }
}

export const ModificationChecker = new ModificationCheckerClass();