import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { MSG_GET_USER, MSG_LOGIN, MSG_LOGOUT } from '../rxjs/serviceworker-messages';
import { sessionCacheName } from '../../swImpl';

declare const self: ServiceWorkerGlobalScope;

class AuthenticationProviderClass {
    public readonly userSubject: ReplaySubject<UserContext>;

    constructor() {
        this.userSubject = new ReplaySubject(1);
        this.updateUser();
        setInterval(() => this.updateUser(), 15 * 60 * 1000);
    }

    async login(credentials: Credentials): Promise<UserContext> {
        const response = await fetch(location.origin + '/couchdb/_session', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials),
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error('invalid credentials');
        }
        const userContext: UserContext = (await response.json());
        this.userSubject.next(userContext);
        return userContext;
    }

    async updateUser(): Promise<void> {
        const req = new Request(location.origin + '/couchdb/_session', {
            credentials: 'same-origin'
        })
        const response = await fetch(req)
            .then((resp) => {
                const clone = resp.clone()
                caches.open(sessionCacheName).then((c) => c.put(req, clone));
                return resp;
            })
            .catch(() => {
                return caches.match(req);
            });
        if (!response || !response.ok) {
            return this.userSubject.next(EMPTY_USER);
        }
        const userContext: UserContext = (await response.json()).userCtx;
        this.userSubject.next(userContext);
    }

    async logout(): Promise<any> {
        const response = await fetch(location.origin + '/couchdb/_session', {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        this.userSubject.next(EMPTY_USER);
    }
}
export const AuthenticationProvider = new AuthenticationProviderClass();

const EMPTY_USER: UserContext = { name: null, roles: [] };

export type UserContext = {
    name: string;
    roles: string[];
}

export type Credentials = {
    username: string;
    password: string;
}
