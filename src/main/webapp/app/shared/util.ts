import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { delay, distinctUntilChanged, concatMap, map } from 'rxjs/operators';
import { of as Observable_of } from 'rxjs/observable/of';

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
    if (res.status >= 200 && res.status < 300) {
        return res;
    } else {
        throw new Error(res.url + ' ' + res.statusText);
    }
}

export const onDayChange = new BehaviorSubject(new Date());

// to get zone right
export function setupUtil() {
    onDayChange.pipe(
        distinctUntilChanged((a, b) => a.getDate() === b.getDate()),
        concatMap((date) => {
            const nextDay = new Date(date);
            nextDay.setHours(24, 0, 0, 0);
            return Observable_of(undefined).pipe(
                delay(nextDay),
                map(() => new Date()));
        }))
        .subscribe(onDayChange);
}
