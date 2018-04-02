import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { of as Observable_of } from 'rxjs/observable/of';
import { LoginModalService } from 'app/shared';
import { ROLE_PUPIL } from 'app/shared/auth/roles';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { StateStorageService } from 'app/shared/auth/state-storage.service';
import { AuthStorageService } from 'app/shared/auth/auth-storage.service';

export const RENEW_PERIOD_WEEKS = 2;
export const EXPIRE_PERIOD_WEEKS = 8;
export const RENEW_PERIOD_MILLIS = RENEW_PERIOD_WEEKS * 7 * 24 * 3600 * 1000;

@Injectable()
export class AuthenticationProviderService {
    public readonly isAuthenticated: BehaviorSubject<boolean>;

    constructor(private loginModalService: LoginModalService,
        private snackBar: MatSnackBar,
        private router: Router,
        private authStorageService: AuthStorageService,
        private stateStorage: StateStorageService) {
        this.isAuthenticated = new BehaviorSubject(true);
        this.updateFromCookie();
        setInterval(this.updateFromCookie, 10000);
    }

    async login(credentials: Credentials): Promise<void> {
        const response = await fetch(location.origin + '/api/v1/auth/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials),
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error('invalid credentials');
        }
        this.updateFromCookie();
        if (!this.isAuthenticated.getValue()) {
            throw new Error('did not return cookie');
        }
    }

    async logout(): Promise<void> {
        try {
            const response = await fetch(location.origin + '/api/v1/auth/session', {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (!response.ok) {
                throw new Error('error while loging out');
            }
            this.updateFromCookie();
            this.navigateAccessDenied(this.router.url);
        } catch (err) {
            this.snackBar.open('Zum Abmelden muss du online sein', null, { duration: 3000 });
            throw err;
        }
    }

    updateFromCookie = () => {
        const session = this.authStorageService.updateFromCookie();
        this.isAuthenticated.next(Boolean(session));
    }

    gotUnauthorized() {
        this.isAuthenticated.next(false);
        this.navigateAccessDenied(this.router.url);
    }

    public navigateAccessDenied(previousUrl: string) {
        if (!previousUrl.startsWith('/accessdenied')) {
            this.stateStorage.storeUrl(previousUrl);
        }
        this.router.navigate(['accessdenied']).then(() => {
            // only show the login dialog, if the user hasn't logged in yet
            if (!this.isAuthenticated.getValue()) {
                this.loginModalService.open();
            }
        });
    }

    hasAnyAuthority(authorities: string[]): Observable<boolean> {
        return this.isAuthenticated.pipe(map((isAuthenticated) => {
            if (!isAuthenticated) {
                return false;
            }
            return authorities.length === 0 || authorities.includes(ROLE_PUPIL);
        }));
    }
}

export type Credentials = {
    username: string;
    password: string;
}
