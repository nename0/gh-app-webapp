import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { combineLatest, pairwise, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ConnectivityService {
    private readonly navigatorOnline = new BehaviorSubject(true);
    private readonly offlineHints = new BehaviorSubject(0);
    public readonly isOnline = new BehaviorSubject(true);

    public readonly loading: Observable<boolean>;
    private readonly loadingTasks = new BehaviorSubject(0);

    constructor() {
        const hasNavigatorOnline = typeof navigator.onLine === 'boolean';
        if (hasNavigatorOnline) {
            window.addEventListener('online', this.navigatorOnlineChange)
            window.addEventListener('offline', this.navigatorOnlineChange)
            this.navigatorOnlineChange();
        }

        this.navigatorOnline.pipe(combineLatest(this.offlineHints), pairwise(),
            map(([[navigatorOnlineNew, hintsNew], [navigatorOnlineOld, hintsOld]]) => {
                if (!navigatorOnlineNew) {
                    return false;
                }
                if (navigatorOnlineNew && !navigatorOnlineOld) {
                    this.offlineHints.next(0);
                    return true;
                }
                return hintsNew < 2;
            }))
            .subscribe(this.isOnline);

        this.loading = this.loadingTasks.pipe(map((countTasks) => countTasks > 0));
    }

    private navigatorOnlineChange = () => {
        this.navigatorOnline.next(navigator.onLine);
    }

    public hintOffline() {
        this.offlineHints.next(this.offlineHints.getValue() + 1);
    }

    public hintOnline() {
        this.offlineHints.next(0);
    }

    public async executeLoadingTask<A, R>(fun: (...args: A[]) => Promise<R>, thisObj: any, ...args: A[]): Promise<R> {
        this.loadingTasks.next(this.loadingTasks.getValue() + 1);
        try {
            const result = await fun.apply(thisObj, args);
            this.hintOnline();
            return result;
        } catch (err) {
            this.hintOffline();
            throw err;
        } finally {
            this.loadingTasks.next(this.loadingTasks.getValue() + - 1);
        }
    }
}
