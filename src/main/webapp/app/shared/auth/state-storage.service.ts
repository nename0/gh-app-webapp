import {Injectable} from '@angular/core';

const PREVIOUS_URL_KEY = 'previousUrl';

@Injectable()
export class StateStorageService {
    constructor() {}

    storeUrl(url: string) {
        window.sessionStorage.setItem(PREVIOUS_URL_KEY, JSON.stringify(url));
    }

    getUrl() {
        return JSON.parse(
            window.sessionStorage.getItem(PREVIOUS_URL_KEY));
    }
}
