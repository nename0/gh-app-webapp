import { idbKeyVal, KEY_AUTH_SESSION } from 'app/shared/idbKeyVal';

const COOKIE_KEY = 'AUTH_SESSION';
export const COOKIE_REGEX = /(?:; |^)AUTH_SESSION=([^;]+)(?:;|$)/;
const AUTH_QUERY_KEY = 'auth';

const inServiceWorker = typeof document === 'undefined';

class AuthStorageClass {
    private authSession: string;

    constructor() {
        if (inServiceWorker) {
            this.updateFromKeyValue();
        }
    }

    public getQueryParam() {
        if (inServiceWorker) {
            this.updateFromKeyValue();
        } else {
            this.updateFromCookie();
        }
        if (!this.authSession) {
            return '';
        }
        return AUTH_QUERY_KEY + '=' + this.authSession;
    }

    public updateFromCookie() {
        const match = document.cookie.match(COOKIE_REGEX);
        this.authSession = match ? match[1] : undefined;
        idbKeyVal.set(KEY_AUTH_SESSION, this.authSession);
        return this.authSession
    }

    private async updateFromKeyValue() {
        this.authSession = await idbKeyVal.get(KEY_AUTH_SESSION);
    }
}

export const AuthStorage = new AuthStorageClass();
