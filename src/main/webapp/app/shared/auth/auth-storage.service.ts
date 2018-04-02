import { idbKeyVal, KEY_AUTH_SESSION } from 'app/shared/idbKeyVal';
import { AuthStorage, COOKIE_REGEX } from 'app/shared/auth/auth-storage';
import { Injectable } from '@angular/core';

@Injectable()
export class AuthStorageService extends AuthStorage {
    constructor() {
        super();
    }

    public updateFromCookie() {
        const match = document.cookie.match(COOKIE_REGEX);
        const value = match ? match[1] : undefined;
        idbKeyVal.set(KEY_AUTH_SESSION, value);
        this.authSession = Promise.resolve(value);
        return value;
    }
}
