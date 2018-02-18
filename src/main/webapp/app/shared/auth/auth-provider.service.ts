import { Injectable } from '@angular/core';
import { serviceWorkerObservable } from '../rxjs/serviceworker-client';
import { MSG_GET_USER, SwMessage, MSG_LOGIN, MSG_LOGOUT } from '../rxjs/serviceworker-messages';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { UserContext, Credentials } from './auth-priovider';
import { pairwise, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { StateStorageService } from './state-storage.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { of as Observable_of } from 'rxjs/observable/of';

export const RENEW_PERIOD_WEEKS = 6;  // For client
export const EXPIRE_PERIOD_WEEKS = 8; // For server
export const RENEW_PERIOD_MILLIS = RENEW_PERIOD_WEEKS * 7 * 24 * 3600 * 1000;

@Injectable()
export class AuthenticationProviderService {
    public readonly userSubject: ReplaySubject<UserContext>;
    public readonly isAuthenticated: BehaviorSubject<boolean>;

    constructor(router: Router,
        stateStorage: StateStorageService) {
        this.userSubject = new ReplaySubject(1);
        const obs = serviceWorkerObservable(MSG_GET_USER, null);
        obs.subscribe(this.userSubject);
        this.isAuthenticated = new BehaviorSubject(false);
        this.userSubject.pipe(map((user) => !!user.name)).subscribe(this.isAuthenticated);
        // Check for user change
        this.userSubject.pipe(pairwise()).subscribe(([prev, now]) => {
            if (!prev.name) {
                // login
                return;
            }
            if (prev.name !== now.name) {
                // logout or userchange
                stateStorage.storeUrl(router.url);
                window.location.reload();
                console.log('RELOAD due to user change from', prev.name, 'to', now.name)
            }
        });
    }

    login(credentials: Credentials): Promise<UserContext> {
        const obs = serviceWorkerObservable(MSG_LOGIN, credentials);
        return obs.toPromise();
    }

    logout(): Promise<any> {
        const obs = serviceWorkerObservable(MSG_LOGOUT, null);
        return obs.toPromise();
    }

    hasAnyAuthority(authorities: string[]): Observable<boolean> {
        return Observable_of(true);
        //TODO
        //return this.userSubject.pipe(map((userCtx) => {
        //    if (!userCtx.name) {
        //        return false;
        //    }
        //    if (!authorities.length) {
        //        return true;
        //    }
        //    for (const role of authorities) {
        //        if (userCtx.roles.includes(role)) {
        //            return true;
        //        }
        //    }
        //    return false;
        //}));
    }

}
