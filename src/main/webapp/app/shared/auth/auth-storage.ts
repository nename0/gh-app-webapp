import { idbKeyVal, KEY_AUTH_SESSION } from 'app/shared/idbKeyVal';

const COOKIE_KEY = 'AUTH_SESSION';
export const COOKIE_REGEX = /(?:; |^)AUTH_SESSION=([^;]+)(?:;|$)/;
const AUTH_HEADER = 'X-AUTH';

export class AuthStorage {
    public authSession: Promise<string>;

    constructor() {
        this.syncKeyValue();
    }

    private async syncKeyValue() {
        this.authSession = idbKeyVal.get(KEY_AUTH_SESSION);
    };

    public async addAuthHeader(headers?: HeadersInit) {
        headers = new Headers(headers);
        const session = await this.authSession;
        if (session) {
            headers.set(AUTH_HEADER, session);
        }
        return headers;
    }
}
