import { checkResponseStatus } from '../shared/util';
import { ParsedPlan } from '../model/plan';
import { idbKeyVal } from '../shared/idbKeyVal';
import { WEEK_DAYS } from '../model/weekdays';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { take } from 'rxjs/operators/take';

function KEY_PLAN(wd: string) {
    return 'plan-' + wd;
}

class PlanFetcherClass {
    private readonly plansCache: { [wd: string]: ReplaySubject<ParsedPlan> };

    constructor() {
        for (const wd of WEEK_DAYS) {
            this.plansCache[wd] = new ReplaySubject(1);
        }
        this.syncKeyValue();
    }

    private syncKeyValue() {
        return Promise.all(
            WEEK_DAYS.map(async (wd) => {
                const result = await idbKeyVal.get(KEY_PLAN(wd));
                if (!result) {
                    return;
                }
                const plan = <ParsedPlan>JSON.parse(result);
                this.plansCache[wd].next(plan);
            })
        );
    }

    private async fetchPlanRequest(weekDay: string) {
        const res = await fetch(window.location.origin + '/api/v1/plans/plan?wd=' + weekDay, {
            credentials: 'same-origin'
        }).then(checkResponseStatus);
        const lastModificationStr = res.headers.get('last-modified');
        if (!lastModificationStr || isNaN(+new Date(lastModificationStr))) {
            throw new Error('no last-modified header');
        }
        const lastModification = new Date(lastModificationStr);
        const inCache = await this.plansCache[weekDay].pipe(take(1)).toPromise();
        if (inCache.modification >= lastModification) {
            if (res.body.cancel) {
                await res.body.cancel();
            }
            return undefined;
        }
        return {
            body: await res.json(),
            modification: lastModification
        };
    }

    private async fetchPlan(weekDay: string) {
        const result = await this.fetchPlanRequest(weekDay);
        while (true) {
            const expected = await this.plansCache[weekDay].pipe(take(1)).toPromise();
            if (expected.modification >= result.modification) {
                return expected;
            }
            if (await idbKeyVal.cas(KEY_PLAN(weekDay), JSON.stringify(expected), JSON.stringify(result))) {
                const plan = ParsedPlan.fromJSON(result.body);
                this.plansCache[weekDay].next(plan);
                return plan;
            }
            await this.syncKeyValue();
        }
    }

    public async fetchAll() {
        await Promise.all(
            WEEK_DAYS.map((wd) =>
                this.fetchPlan(wd)
            )
        );
    }
}

export const PlanFetcher = new PlanFetcherClass();

class PlanRequest {
    constructor(
        public promise: Promise<ParsedPlan>,
        public modification: Date) { }
}
