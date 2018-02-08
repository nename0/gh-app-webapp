import { getDateString, getDateTimeString, onDayChange } from '../shared/util';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { map, combineLatest, distinctUntilChanged } from 'rxjs/operators';
import { getWeekDayShortStr } from './weekdays';

export class ParsedPlan {
    public weekDay: string;
    public planDate: Date;
    public modification: Date
    public outdated: Observable<boolean>;
    public messages: string = '';
    public substitutes: Substitute[] = [];

    constructor(obj: any) {
        this.weekDay = obj.weekDay;
        this.planDate = new Date(obj.planDate);
        this.modification = new Date(obj.modification);
        this.messages = obj.messages;
        this.substitutes = obj.substitutes.map((substitute) => new Substitute(substitute));
        this.outdated = onDayChange.pipe(map((date) =>
            date.getTime() > new Date(this.planDate).setHours(23, 59, 59, 999)
        ),
            distinctUntilChanged());
    }

    getFirstLine(): Observable<string> {
        return getDateString(this.planDate).pipe(combineLatest(this.outdated),
            map(([dateStr, isOutdated]) => {
                const start = getWeekDayShortStr(this.weekDay) + ': ';
                if (isOutdated) {
                    return start + 'Veraltet';
                }
                return start + dateStr;
            }),
            distinctUntilChanged());
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

export class Substitute {
    public classText: string;
    public lesson: string;
    public substitute: string;
    public teacher: string;
    public insteadOf: string;
    public room: string;
    public extra: string;

    constructor(obj: any) {
        this.classText = obj.classText;
        this.lesson = obj.lesson;
        this.substitute = obj.substitute;
        this.teacher = obj.teacher;
        this.insteadOf = obj.insteadOf;
        this.room = obj.room;
        this.extra = obj.extra;
    }
}
