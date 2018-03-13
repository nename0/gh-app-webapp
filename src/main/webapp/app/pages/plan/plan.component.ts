import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material';
import { switchMap, map, distinctUntilChanged, pluck, publishReplay, refCount, take } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Substitute } from '../../model/plan';
import { getDateString, getDateTimeString } from '../../shared/util';
import { getWeekDayShortStr } from '../../model/weekdays';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { AppBarService } from '../../layouts/main/appbar.service';
import { UNKNOWN_FILTER, ALL_FILTER, COMMON_FILTER, SELECTABLE_FILTERS } from '../../model/filter';
import { FilterService } from '../../shared/services/filter.service';
import { PlanFetcherService } from '../../shared/services/plan-fetcher.service';
import { RxParsedPlan } from '../../model/rx-plan';
import { ChangeIndicatorService } from 'app/shared/services/change-indicator.service';

@Component({
    selector: 'app-plan-comp',
    templateUrl: './plan.component.html',
    styleUrls: [
        'plan.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class PlanComponent {
    readonly planObs: Observable<RxParsedPlan>;
    readonly substitutesObs: Observable<Substitute[]>;

    constructor(
        private route: ActivatedRoute,
        private planFetcher: PlanFetcherService,
        private filterService: FilterService,
        private appBarService: AppBarService,
        private changeIndicatorService: ChangeIndicatorService) {

        this.planObs = this.route.params.pipe(switchMap((params) => {
            // remove changeIndicator
            const obs = this.planFetcher.getPlanObservable(params.wd);
            obs.pipe(take(1)).toPromise().then((plan) => {
                this.changeIndicatorService.openedPlan(plan);
            });
            return obs;
        }), publishReplay(1), refCount());
        this.substitutesObs = combineLatest(this.planObs, this.filterService.getSelectedFilters()).pipe(
            map(([plan, selectedFilters]) => {
                // filter substitites
                const filteredSubstitutes = plan.filtered.filteredSubstitutes;
                if (selectedFilters.length) {
                    return filteredSubstitutes[UNKNOWN_FILTER]
                        .concat(...selectedFilters.map((filter) => filteredSubstitutes[filter] || []))
                        .concat(filteredSubstitutes[COMMON_FILTER]);
                }
                return filteredSubstitutes[ALL_FILTER]
                    .concat(filteredSubstitutes[COMMON_FILTER]);
            }));

        const titleObs = this.planObs.pipe(
            switchMap((plan) => plan.getTitle()));
        this.appBarService.setTitle(titleObs);
        const subtitleObs = this.planObs.pipe(
            switchMap((plan) => plan.getSecondLine()));
        this.appBarService.setSubTitle(subtitleObs);
    }

    trackBy(index, substitute) {
        return substitute;
    }
}
