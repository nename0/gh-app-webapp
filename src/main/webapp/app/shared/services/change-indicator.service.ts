import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { idbKeyVal } from '../idbKeyVal';
import { WEEK_DAYS } from 'app/model/weekdays';
import { Observable } from 'rxjs/Observable';
import { ParsedPlan } from 'app/model/plan';
import { FilterService } from 'app/shared/services/filter.service';
import { ALL_FILTER, isFilterHashFromDate } from 'app/model/filter';
import { combineLatest, map, take } from 'rxjs/operators';

function KEY_SEEN_FILTER_HASH(wd: string) {
    return 'seenFilterHash-' + wd;
}

@Injectable()
export class ChangeIndicatorService {
    private readonly seenFilterHashes: { [wd: string]: ReplaySubject<{ [filter: string]: string }> };

    constructor(private filterService: FilterService) {
        this.seenFilterHashes = {};
        for (const wd of WEEK_DAYS) {
            this.seenFilterHashes[wd] = new ReplaySubject(1);
        }
        this.syncKeyValue();
        setInterval(this.syncKeyValue, 10000);
    }

    private syncKeyValue = () => {
        return Promise.all(
            WEEK_DAYS.map(async (wd) => {
                const result = await idbKeyVal.get(KEY_SEEN_FILTER_HASH(wd));
                if (!result) {
                    this.seenFilterHashes[wd].next(undefined);
                    return;
                }
                try {
                    this.seenFilterHashes[wd].next(JSON.parse(result));
                } catch (err) {
                    this.seenFilterHashes[wd].next(undefined);
                    return idbKeyVal.set(KEY_SEEN_FILTER_HASH(wd), undefined);
                }
            })
        );
    }

    public isChanged(plan: ParsedPlan): Observable<boolean> {
        return this.seenFilterHashes[plan.weekDay].pipe(
            combineLatest(this.filterService.getSelectedFilters()),
            map(([seenFilterHashesOfWeekDay, selectedFilters]) => {
                if (!seenFilterHashesOfWeekDay) {
                    // no value in db; happens for new users or after reset in both cases we don't want to show the changed indicator
                    this.openedPlan(plan);
                    return false;
                }
                if (!selectedFilters.length) {
                    selectedFilters = [ALL_FILTER];
                }
                for (const filter of selectedFilters) {
                    const seenFilterHash = seenFilterHashesOfWeekDay[filter];
                    const planFilterHash = plan.filtered.filterHashes[filter];
                    if (seenFilterHash && !planFilterHash && isFilterHashFromDate(seenFilterHash, plan.planDate)) {
                        // user has seen a plan of the same date with substitutes, but they got removed => indicate changed
                        return true;
                    }
                    if (planFilterHash && planFilterHash !== seenFilterHash) {
                        return true;
                    }
                }
                return false;
            }));
    }

    public async openedPlan(plan: ParsedPlan) {
        let selectedFilters = await this.filterService.getSelectedFilters().pipe(take(1)).toPromise();
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
        await idbKeyVal.set(KEY_SEEN_FILTER_HASH(plan.weekDay), newStr);
        this.seenFilterHashes[plan.weekDay].next(newValue);
    }

    public reset() {
        // reset to don't show change indicator on filter change
        WEEK_DAYS.forEach((wd) => {
            idbKeyVal.set(KEY_SEEN_FILTER_HASH(wd), undefined);
            this.seenFilterHashes[wd].next(undefined);
        });
    }
}
