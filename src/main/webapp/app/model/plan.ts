import { getWeekDayShortStr } from './weekdays';

export class ParsedPlan {
    public weekDay: string;
    public planDate: Date;
    public modification: Date
    public messages: string = '';
    public filtered: FilteredPlan;

    constructor(obj: any) {
        this.weekDay = obj.weekDay;
        this.planDate = new Date(obj.planDate);
        this.modification = new Date(obj.modification);
        this.messages = obj.messages;
        this.filtered = new FilteredPlan(obj.filtered);
    }

    // for RxParsedPlan
    getJSON(): string {
        return JSON.stringify(this, function(key, value) {
            if (['outdated'].includes(key)) {
                return undefined;
            }
            return value;
        })
    }
};

export class FilteredPlan {
    public filterHashes: { [filter: string]: string };

    public filteredSubstitutes: { [filter: string]: Substitute[] };

    constructor(obj: any) {
        this.filterHashes = obj.filterHashes;
        this.filteredSubstitutes = {};
        for (const filter in obj.filteredSubstitutes) {
            if (obj.filteredSubstitutes.hasOwnProperty(filter)) {
                this.filteredSubstitutes[filter] = obj.filteredSubstitutes[filter]
                    .map((substitute) => new Substitute(substitute));
            }
        }
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
