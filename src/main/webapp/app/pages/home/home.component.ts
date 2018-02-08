import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoginModalService, JhiLoginDialogComponent } from '../../shared';
import { MatDialogRef } from '@angular/material';
import { switchMap, map } from 'rxjs/operators';
import { defer as Observable_defer } from 'rxjs/observable/defer';
import { WEEK_DAYS, getWeekDayDisplayStr } from '../../model/weekdays';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ParsedPlan } from '../../model/plan';
import { PlanFetcherService } from '../../net/plan-fetcher';
import { ModificationCheckerService } from '../../net/modification-checker';
import { getDateTimeString } from '../../shared/util';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: [
        'home.css'
    ]

})
export class HomeComponent {
    readonly weekDays: string[];

    readonly firstLines: { [wd: string]: Observable<string> } = {};
    readonly secondLines: { [wd: string]: Observable<string> } = {};
    readonly outdated: { [wd: string]: Observable<boolean> } = {};

    readonly lastUpdate: Observable<string>;

    constructor(
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef,
        private planFetcher: PlanFetcherService,
        private modificationChecker: ModificationCheckerService
    ) {
        this.weekDays = WEEK_DAYS;

        for (const wd of WEEK_DAYS) {
            const planObs = this.planFetcher.getCacheValue(wd);
            this.firstLines[wd] = planObs.pipe(switchMap((plan) => plan.getFirstLine()))
            this.secondLines[wd] = planObs.pipe(switchMap((plan) => plan.getSecondLine()))
            this.outdated[wd] = planObs.pipe(switchMap((plan) => plan.outdated))
        }
        this.lastUpdate = modificationChecker.lastUpdate
            .pipe(switchMap((date) => getDateTimeString(date)));
    }

    trackBy(index, weekDay) {
        return weekDay;
    }

    onclick(weekday: string) {
        this.router.navigate(['/plan/' + weekday]);
    }
}
