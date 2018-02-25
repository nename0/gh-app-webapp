import { checkResponseStatus } from '../shared/util';
import { ParsedPlan } from '../model/plan';
import { idbKeyVal } from '../shared/idbKeyVal';
import { WEEK_DAYS, getWeekDayIndex } from '../model/weekdays';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { take } from 'rxjs/operators/take';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ConnectivityService } from './connectivity';

function KEY_PLAN(wd: string) {
    return 'plan-' + wd;
}

@Injectable()
export class PlanFetcherService {
    public readonly plansCache: { [wd: string]: BehaviorSubject<ParsedPlan> };

    constructor(private connectivityService: ConnectivityService) {
        this.plansCache = {};
        for (const wd of WEEK_DAYS) {
            this.plansCache[wd] = new BehaviorSubject(undefined);
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
                const cacheValue = this.plansCache[wd].getValue();
                if (cacheValue && result === cacheValue.getJSON()) {
                    return;
                } try {
                    const plan = new ParsedPlan(JSON.parse(result));
                    this.plansCache[wd].next(plan);
                } catch (err) {
                    return idbKeyVal.set(KEY_PLAN(wd), undefined);
                }
            })
        );
    }

    private async fetchPlanRequest(weekDay: string) {
        const res = await fetch(window.location.origin + '/api/v1/plans/plan?wd=' + weekDay, {
            credentials: 'same-origin'
        }).then(checkResponseStatus);
        return res.json();
    }

    private async fetchPlan(weekDay: string) {
        const result = await this.fetchPlanRequest(weekDay);
        while (true) {
            await this.syncKeyValue();
            const cacheValue = this.plansCache[weekDay].getValue();
            const cacheModification = cacheValue ? cacheValue.modification : new Date(0);
            if (cacheModification >= new Date(result.modification)) {
                console.log('fetched ' + weekDay + ' unchanged');
                // repush to indicate loading
                this.plansCache[weekDay].next(cacheValue);
                return false;
            }
            console.log('fetched ' + weekDay + ' changed');
            const plan = new ParsedPlan(result);
            if (await idbKeyVal.cas(KEY_PLAN(weekDay), cacheValue instanceof ParsedPlan ? cacheValue.getJSON() : JSON.stringify(cacheValue), plan.getJSON())) {
                this.plansCache[weekDay].next(plan);
                return true;
            }
        }
    }

    public fetchAll() {
        const promises = new Array<Promise<boolean>>(WEEK_DAYS.length);
        let index = getWeekDayIndex(new Date());
        for (; !promises[index]; index = (index + 1) % WEEK_DAYS.length) {
            const wd = WEEK_DAYS[index]
            promises[index] = this.connectivityService.executeLoadingTask(this.fetchPlan, this, wd);
        }
        return Promise.all(promises)
            .then((changedArray) => {
                return changedArray.some((c) => c);
            });
    }

    public getCacheValue(weekDay: string) {
        return this.plansCache[weekDay].pipe(filter((value) => !!value));
    }
}
