import {Injectable} from '@angular/core';

@Injectable()
export class StateStorageService {
    constructor() {}

    storeUrl(url: string) {
        window.sessionStorage.setItem('previousUrl', JSON.stringify(url));
    }

    getUrl() {
        console.log('getUrl', window.sessionStorage.getItem('previousUrl'));
        return JSON.parse(
            window.sessionStorage.getItem('previousUrl'));
    }
}
