import { ParsedPlan } from '../model/plan';
import { idbKeyVal } from '../shared/idbKeyVal';
import { WEEK_DAYS, getWeekDayIndex } from '../model/weekdays';
import { ConnectivityService } from './connectivity';

function KEY_PLAN(wd: string) {
    return 'plan-' + wd;
}

export abstract class PlanFetcher {
    constructor() {
    }

    protected abstract setCacheValue(wd: string, plan: ParsedPlan);
    protected abstract getCacheValue(wd: string): ParsedPlan;

    protected executeLoadingTask<A, R>(fun: (...args: A[]) => Promise<R>, ...args: A[]): Promise<R> {
        return fun.apply(this, args);
    }

    protected createParsedPlan(obj: any): ParsedPlan {
        return new ParsedPlan(obj);
    }

    public syncKeyValue() {
        return Promise.all(
            WEEK_DAYS.map(async (wd) => {
                const result = await idbKeyVal.get(KEY_PLAN(wd));
                if (!result) {
                    return;
                }
                const cacheValue = this.getCacheValue(wd);
                if (cacheValue && result === cacheValue.getJSON()) {
                    return;
                }
                try {
                    const plan = this.createParsedPlan(JSON.parse(result));
                    this.setCacheValue(wd, plan);
                } catch (err) {
                    return idbKeyVal.set(KEY_PLAN(wd), undefined);
                }
            })
        );
    }

    private async fetchPlanRequest(weekDay: string) {
        const res = await fetch(location.origin + '/api/v1/plans/plan?wd=' + weekDay, {
            credentials: 'same-origin'
        });
        if (typeof window === 'object' && res.status === 401) {
            alert('Du benutzt eine alte Version. Bitte Seite schließen und wieder öffnen');
        }
        if (res.status < 200 || res.status >= 300) {
            throw new Error(res.url + ' ' + res.statusText);
        }
        return res.json();
    }

    private async fetchPlan(weekDay: string) {
        const result = await this.fetchPlanRequest(weekDay);
        while (true) {
            await this.syncKeyValue();
            const expected = this.getCacheValue(weekDay);
            const expectedStr = expected instanceof ParsedPlan ? expected.getJSON() : JSON.stringify(expected);
            const newValue = this.createParsedPlan(result);
            const newStr = newValue.getJSON();
            if (expectedStr === newStr) {
                console.log('fetched ' + weekDay + ' unchanged');
                // repush to indicate loading
                this.setCacheValue(weekDay, expected);
                return false;
            }
            console.log('fetched ' + weekDay + ' changed');
            if (await idbKeyVal.cas(KEY_PLAN(weekDay), expectedStr, newStr)) {
                this.setCacheValue(weekDay, newValue);
                return true;
            }
        }
    }

    public fetchAll() {
        const promises = new Array<Promise<boolean>>(WEEK_DAYS.length);
        let index = getWeekDayIndex(new Date());
        for (; !promises[index]; index = (index + 1) % WEEK_DAYS.length) {
            const wd = WEEK_DAYS[index]
            promises[index] = this.executeLoadingTask(this.fetchPlan, wd);
        }
        return Promise.all(promises)
            .then((changedArray) => {
                return changedArray.some((c) => c);
            });
    }
}
