import { onDayChange } from '../shared/util';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class ParsedPlan {
    public weekDay: string;
    public planDate: Date;
    public modification: Date
    public outdated: BehaviorSubject<boolean>;
    public messages: string = '';
    public substitutes: Substitute[] = [];

    constructor() {
        this.outdated = new BehaviorSubject(false);
        this.checkOutdated();
        onDayChange.subscribe(() => this.checkOutdated());
    }

    public checkOutdated() {
        this.outdated.next(new Date(this.planDate).setUTCHours(23, 59, 59, 999) < Date.now());
    }

    public static fromJSON(json: string): ParsedPlan {
        const obj = JSON.parse(json);
        ParsedPlan.apply(obj);
        (<ParsedPlan>obj).substitutes.forEach((substitute) => {
            Substitute.apply(substitute);
        })
        return <ParsedPlan>obj;
    }
};

export class Substitute {

    constructor(
        public classText: string,
        public lesson: string,
        public substitute: string,
        public teacher: string,
        public insteadOf: string,
        public room: string,
        public extra: string
    ) { }
}
