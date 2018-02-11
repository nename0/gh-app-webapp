import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { PlanFetcherService } from '../../net/plan-fetcher';
import { ParsedPlan } from '../../model/plan';
import { getDateString, getDateTimeString } from '../../shared/util';
import { getWeekDayShortStr } from '../../model/weekdays';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { AppBarService } from '../../layouts/main/appbar.service';

@Component({
    selector: 'app-plan-comp',
    templateUrl: './plan.component.html',
    styleUrls: [
        'plan.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class PlanComponent {
    readonly planObs: Observable<ParsedPlan>;

    constructor(
        private route: ActivatedRoute,
        private planFetcher: PlanFetcherService,
        private appBarService: AppBarService) {
        this.planObs = this.route.params.pipe(switchMap((params) => this.planFetcher.getCacheValue(params.wd)));

        const titleObs = combineLatest(
            this.route.params,
            this.planObs.pipe(switchMap((plan) => getDateString(plan.planDate)))
        ).pipe(map(([params, dateStr]) => getWeekDayShortStr(params.wd) + ', ' + dateStr));
        this.appBarService.setTitle(titleObs);
        const subtitleObs = this.planObs.pipe(
            switchMap((plan) => getDateTimeString(plan.modification)),
            map((dateTimeStr) => 'Stand: ' + dateTimeStr));
        this.appBarService.setSubTitle(subtitleObs);

        //TODO ModificationChecker not loaded when this comonent is first
    }

    trackBy(index, substitute) {
        return substitute;
    }
}
