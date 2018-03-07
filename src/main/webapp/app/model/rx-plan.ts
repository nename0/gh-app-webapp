import { getDateString, getDateTimeString, onDayChange } from '../shared/util';
import { Observable } from 'rxjs/Observable';
import { map, combineLatest, distinctUntilChanged } from 'rxjs/operators';
import { getWeekDayShortStr } from './weekdays';
import { ParsedPlan } from './plan';

export class RxParsedPlan extends ParsedPlan {
    public outdated: Observable<boolean>;

    constructor(obj: any) {
        super(obj);
        this.outdated = onDayChange.pipe(map((date) =>
            date.getTime() > new Date(this.planDate).setHours(23, 59, 59, 999)
        ),
            distinctUntilChanged());
    }

    getTitle(): Observable<string> {
        return getDateString(this.planDate).pipe(
            map((dateStr) => {
                return getWeekDayShortStr(this.weekDay) + ', ' + dateStr
            }));
    }

    getFirstLine(): Observable<string> {
        return getDateString(this.planDate).pipe(combineLatest(this.outdated),
            map(([dateStr, isOutdated]) => {
                const start = getWeekDayShortStr(this.weekDay) + ': ';
                if (isOutdated) {
                    return start + 'Veraltet';
                }
                return start + dateStr;
            }));
    }

    getSecondLine(): Observable<string> {
        return getDateTimeString(this.modification).pipe(map((dateTimeStr) => {
            return 'Stand: ' + dateTimeStr;
        }));
    }

    getJSON(): string {
        return JSON.stringify(this, function(key, value) {
            if (['outdated'].includes(key)) {
                return undefined;
            }
            return value;
        })
    }
};
