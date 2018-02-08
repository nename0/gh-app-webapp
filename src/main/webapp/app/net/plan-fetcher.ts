import { checkResponseStatus } from '../shared/util';
import { ParsedPlan } from '../model/plan';
import { idbKeyVal } from '../shared/idbKeyVal';
import { WEEK_DAYS } from '../model/weekdays';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { take } from 'rxjs/operators/take';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ConnectivityService } from './connectivity';

function KEY_PLAN(wd: string) {
    return 'plan-' + wd;
}

@Injectable()
export class PlanFetcherService {
    private readonly plansCache: { [wd: string]: BehaviorSubject<ParsedPlan> };

    constructor(private connectivityService: ConnectivityService) {
        this.plansCache = {};
        for (const wd of WEEK_DAYS) {
            this.plansCache[wd] = new BehaviorSubject(undefined);
        }
        this.syncKeyValue();
    }

    private syncKeyValue(): Promise<ParsedPlan[]> {
        return Promise.all(
            WEEK_DAYS.map(async (wd) => {
                const result = await idbKeyVal.get(KEY_PLAN(wd));
                if (!result) {
                    return undefined;
                }
                const plan = new ParsedPlan(JSON.parse(result));
                this.plansCache[wd].next(plan);
            })
        );
    }

    private async fetchPlanRequest(weekDay: string, inCache: Date) {
        const res = await fetch(window.location.origin + '/api/v1/plans/plan?wd=' + weekDay, {
            credentials: 'same-origin'
        }).then(checkResponseStatus);
        const lastModificationStr = res.headers.get('last-modified');
        if (!lastModificationStr || isNaN(+new Date(lastModificationStr))) {
            throw new Error('no last-modified header');
        }
        const lastModification = new Date(lastModificationStr);
        if (inCache >= lastModification) {
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
        await this.syncKeyValue();
        let cacheValue = this.plansCache[weekDay].getValue();
        let cacheModification = cacheValue ? cacheValue.modification : new Date(0);
        const result = await this.fetchPlanRequest(weekDay, cacheModification);
        this.connectivityService.hintOnline();
        if (!result) {
            // not modified
            return cacheValue;
        }
        while (true) {
            if (cacheModification >= result.modification) {
                return cacheValue;
            }
            const plan = new ParsedPlan(result.body);
            if (await idbKeyVal.cas(KEY_PLAN(weekDay), JSON.stringify(cacheValue), plan.getJSON())) {
                this.plansCache[weekDay].next(plan);
                return plan;
            }
            await this.syncKeyValue();
            cacheValue = this.plansCache[weekDay].getValue();
            cacheModification = cacheValue ? cacheValue.modification : new Date(0);
        }
    }

    public fetchAll() {
        return Promise.all(
            WEEK_DAYS.map((wd) =>
                this.fetchPlan(wd)
            )
        ).catch((err) => {
            this.connectivityService.hintOffline();
            console.log('error in fetchAll', err);
        });
    }

    public getCacheValue(weekDay: string) {
        return this.plansCache[weekDay].pipe(filter((value) => !!value));
    }
}
