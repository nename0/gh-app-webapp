import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { delay, distinctUntilChanged, concatMap, map } from 'rxjs/operators';
import { of as Observable_of } from 'rxjs/observable/of';
import { idbKeyVal } from '../shared/idbKeyVal';

const KEY_BROWSER_FINGERPRINT = 'browserFingerprint';

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (exclusive)
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function getDateString(date: Date): Observable<string> {
    return onDayChange.pipe(map((now) => {
        const dayDiff = date.getDate() - now.getDate();
        switch (dayDiff) {
            case -2:
                return 'Vorgestern';
            case -1:
                return 'Gestern';
            case 0:
                return 'Heute';
            case 1:
                return 'Morgen';
            case 2:
                return 'Übermorgen';
        }
        const day = date.getDate().toLocaleString('en', { minimumIntegerDigits: 2 });
        const month = (date.getMonth() + 1).toLocaleString('en', { minimumIntegerDigits: 2 });
        return day + '.' + month;
    }),
        distinctUntilChanged());
}

export function getDateTimeString(date: Date): Observable<string> {
    return getDateString(date).pipe(map((dateStr) => {
        const hour = date.getHours().toLocaleString('en', { minimumIntegerDigits: 2 });
        const minutes = date.getMinutes().toLocaleString('en', { minimumIntegerDigits: 2 });
        return dateStr + ' ' + hour + ':' + minutes;
    }),
        distinctUntilChanged());
}

export function checkResponseStatus(res: Response) {
    if (res.status === 401) {
        alert('Du benutzt eine alte Version. Bitte Seite schließen und wieder öffnen');
    }
    if (res.status >= 200 && res.status < 300) {
        return res;
    } else {
        throw new Error(res.url + ' ' + res.statusText);
    }
}

const onDayChangeBehavior = new BehaviorSubject(new Date());
export const onDayChange = onDayChangeBehavior.pipe(
    distinctUntilChanged((a, b) => a.getDate() === b.getDate()))

export let browserFingerprint: Promise<string>;

// to get zone right
export function setupUtil() {
    onDayChange.pipe(
        concatMap((date) => {
            const nextDay = new Date(date);
            nextDay.setHours(24, 0, 0, 0);
            return Observable_of(undefined).pipe(
                delay(nextDay),
                map(() => new Date()));
        }))
        .subscribe(onDayChangeBehavior);
    window.onfocus = () => {
        onDayChangeBehavior.next(new Date());
    }

    browserFingerprint = (async () => {
        function genFinerprint() {
            const randomNumbers = Array(4).fill(0).map(() => Math.random());
            const baseString = randomNumbers.toString() + navigator.userAgent;
            const hashCodeNumbers = baseString.split('').reduce((array, char, index) => {
                index = index % 4;
                array[index] = ((array[index] * 31) + char.charCodeAt(0)) % Number.MAX_SAFE_INTEGER;
                return array;
            }, [0, 0, 0, 0]);
            return hashCodeNumbers
                .map((n) => ('0'.repeat(14) + n.toString(16)).slice(-14))  // pad each to 14 chars
                .join('');
        }
        while (true) {
            let fingerprint = await idbKeyVal.get(KEY_BROWSER_FINGERPRINT);
            if (fingerprint) {
                return fingerprint;
            }
            fingerprint = genFinerprint();
            if (await idbKeyVal.cas(KEY_BROWSER_FINGERPRINT, undefined, fingerprint)) {
                console.log('browser fingerprint set to', fingerprint);
                return fingerprint;
            }
        }
    })();
}
