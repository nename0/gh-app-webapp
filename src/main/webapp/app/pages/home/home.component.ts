import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoginModalService, JhiLoginDialogComponent } from '../../shared';
import { MatDialogRef } from '@angular/material';
import { switchMap, map, delay, concat, skip, startWith } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { of as Observable_of } from 'rxjs/observable/of';
import { WEEK_DAYS, getWeekDayDisplayStr } from '../../model/weekdays';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ParsedPlan } from '../../model/plan';
import { ModificationCheckerService } from '../../net/modification-checker';
import { getDateTimeString } from '../../shared/util';
import { ConnectivityService } from '../../net/connectivity';
import { AppBarService } from '../../layouts/main/appbar.service';
import { WebsocketHandlerService } from '../../net/websocket';
import { PlanFetcherService } from '../../shared/services/plan-fetcher.service';

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
    readonly blink: { [wd: string]: Observable<boolean> } = {};

    readonly loading: Observable<boolean>;

    constructor(
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef,
        private planFetcher: PlanFetcherService,
        private modificationChecker: ModificationCheckerService,
        private connectivityService: ConnectivityService,
        private appBarService: AppBarService
    ) {
        this.weekDays = WEEK_DAYS;

        for (const wd of this.weekDays) {
            const planObs = this.planFetcher.getPlanObservable(wd);
            this.firstLines[wd] = planObs.pipe(switchMap((plan) => plan.getFirstLine()));
            this.secondLines[wd] = planObs.pipe(switchMap((plan) => plan.getSecondLine()));
            this.outdated[wd] = planObs.pipe(switchMap((plan) => plan.outdated));
            this.blink[wd] = planObs.pipe(skip(1), switchMap(() => {
                const delayed = Observable_of(false).pipe(delay(150))
                return Observable_of(true).pipe(concat(delayed));
            }));
        }
        this.loading = this.connectivityService.loading;
        const lastUpdate = this.modificationChecker.lastUpdate
            .pipe(switchMap((date) => getDateTimeString(date)), startWith('Keine'));
        const subtitleObs = combineLatest(this.connectivityService.isOnline, lastUpdate)
            .pipe(map(([isOnline, lastUpdateStr]) => {
                if (isOnline) {
                    return undefined;
                }
                return 'Offline - Letzte Verbindung: ' + lastUpdateStr;
            }));
        this.appBarService.setSubTitle(subtitleObs);
    }

    trackBy(index, weekDay) {
        return weekDay;
    }

    forceUpdate() {
        this.modificationChecker.forceUpdate();
    }

    onclick(weekday: string) {
        this.router.navigate(['/plan/' + weekday]);
    }
}
