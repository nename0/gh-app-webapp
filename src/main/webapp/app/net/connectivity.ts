import { Injectable } from '@angular/core';
import { getRandomArbitrary } from '../shared/util';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { combineLatest, pairwise, map, filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

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
            map(([[navigatorOnlineOld, hintsOld], [navigatorOnlineNew, hintsNew]]) => {
                if (!navigatorOnlineNew) {
                    return false;
                }
                if (navigatorOnlineNew && !navigatorOnlineOld) {
                    if (this.offlineHints.getValue() > 0) {
                        this.offlineHints.next(0);
                    }
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

    public startLoadingTask() {
        this.loadingTasks.next(this.loadingTasks.getValue() + 1);
    }

    public endLoadingTask() {
        this.loadingTasks.next(this.loadingTasks.getValue() - 1);
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
            this.loadingTasks.next(this.loadingTasks.getValue() - 1);
        }
    }

    public scheduleRetryTask(fun: (...args: any[]) => any) {
        if (this.navigatorOnline.getValue()) {
            const handle = setTimeout(fun, getRandomArbitrary(1000, 4000));
            return function() {
                clearTimeout(handle);
            }
        }
        let onOnline: Subscription;
        const timeout = setTimeout(function() {
            onOnline.unsubscribe();
            fun();
        }, getRandomArbitrary(59000, 61000));
        onOnline = this.navigatorOnline
            .pipe(filter((isOnline) => isOnline), take(1))
            .subscribe(() => {
                clearTimeout(timeout);
                fun();
            });
        return function () {
            clearTimeout(timeout);
            onOnline.unsubscribe();
        }
    }
}
