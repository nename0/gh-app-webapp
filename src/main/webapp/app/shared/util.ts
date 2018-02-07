import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { concatMap } from 'rxjs/operators/concatMap';
import { Observable } from 'rxjs/Observable';
import { of as Observable_of } from 'rxjs/observable/of';
import { delay } from 'rxjs/operators/delay';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { tap } from 'rxjs/operators/tap';
import { Subject } from 'rxjs/Subject';
import { switchMap } from 'rxjs/operators/switchMap';

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

export function checkResponseStatus(res: Response) {
    if (res.status >= 200 && res.status < 300) {
        return res;
    } else {
        throw new Error(res.url + ' ' + res.statusText);
    }
}

const scheduleDayChangeCheck = new BehaviorSubject(new Date());
export const onDayChange = new Subject<void>();
scheduleDayChangeCheck.pipe(distinctUntilChanged((a, b) => a.getDay() === b.getDay()),
    switchMap((date) => {
        scheduleDayChangeCheck.next(new Date());
        return Observable_of(undefined).pipe(
            delay(new Date(date).setHours(24, 0, 0, 0)),
            tap(() => scheduleDayChangeCheck.next(new Date())));
    }))
    .subscribe(onDayChange);
