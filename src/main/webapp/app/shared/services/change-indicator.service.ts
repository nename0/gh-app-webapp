import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { idbKeyVal } from '../idbKeyVal';
import { WEEK_DAYS } from 'app/model/weekdays';
import { Observable } from 'rxjs/Observable';
import { ParsedPlan } from 'app/model/plan';
import { FilterService } from 'app/shared/services/filter.service';
import { ALL_FILTER, isFilterHashFromDate } from 'app/model/filter';
import { combineLatest, map } from 'rxjs/operators';

function KEY_SEEN_FILTER_HASH(wd: string) {
    return 'seenFilterHash-' + wd;
}

@Injectable()
export class ChangeIndicatorService {
    private readonly seenFilterHashes: { [wd: string]: BehaviorSubject<{ [filter: string]: string }> };

    constructor(private filterService: FilterService) {
        this.seenFilterHashes = {};
        for (const wd of WEEK_DAYS) {
            this.seenFilterHashes[wd] = new BehaviorSubject({});
        }
        this.syncKeyValue();
        setInterval(this.syncKeyValue, 10000);
    }

    private syncKeyValue = () => {
        return Promise.all(
            WEEK_DAYS.map(async (wd) => {
                const result = await idbKeyVal.get(KEY_SEEN_FILTER_HASH(wd));
                if (!result) {
                    return idbKeyVal.set(KEY_SEEN_FILTER_HASH(wd), JSON.stringify({}));
                }
                const cacheValue = this.seenFilterHashes[wd].getValue();
                if (cacheValue && result === JSON.stringify(cacheValue)) {
                    return;
                }
                try {
                    this.seenFilterHashes[wd].next(JSON.parse(result));
                } catch (err) {
                    return idbKeyVal.set(KEY_SEEN_FILTER_HASH(wd), JSON.stringify({}));
                }
            })
        );
    }

    public isChanged(plan: ParsedPlan): Observable<boolean> {
        return this.seenFilterHashes[plan.weekDay].pipe(
            combineLatest(this.filterService.selectedFilters),
            map(([seenFilterHashesOfWeekDay, selectedFilters]) => {
                if (!selectedFilters.length) {
                    selectedFilters = [ALL_FILTER];
                }
                for (const filter of selectedFilters) {
                    const seenFilterHash = seenFilterHashesOfWeekDay[filter];
                    if (!seenFilterHash) {
                        // only show changed if user has seen the plan and the filter once
                        continue;
                    }
                    const planFilterHash = plan.filtered.filterHashes[filter];
                    if (!planFilterHash && isFilterHashFromDate(seenFilterHash, plan.planDate)) {
                        // if user has seen a plan of the same date with substitutes, they got removed => changed
                        return true;
                    }
                    if (planFilterHash !== seenFilterHash) {
                        return true;
                    }
                }
                return false;
            }));
    }

    public async openedPlan(plan: ParsedPlan) {
        let selectedFilters = this.filterService.selectedFilters.getValue();
        if (!selectedFilters.length) {
            selectedFilters = [ALL_FILTER];
        }
        const newValue: { [filter: string]: string } = {};
        for (const filter of selectedFilters) {
            const filterHash = plan.filtered.filterHashes[filter];
            if (filterHash) {
                newValue[filter] = filterHash;
            }
        }
        const newStr = JSON.stringify(newValue);
        const weekday = plan.weekDay;
        while (true) {
            const expected = this.seenFilterHashes[weekday].getValue();
            const expectedStr = JSON.stringify(expected);
            if (expectedStr === newStr) {
                return;
            }
            if (await idbKeyVal.cas(KEY_SEEN_FILTER_HASH(weekday), expectedStr, newStr)) {
                this.seenFilterHashes[weekday].next(newValue);
                return;
            }
            await this.syncKeyValue();
        }
    }
}
