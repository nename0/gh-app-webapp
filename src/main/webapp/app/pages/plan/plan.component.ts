import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material';
import { switchMap } from 'rxjs/operators';
import { switchMapLateUnsubscribe } from '../../shared/rxjs/switchMapLateUnsubscribe';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { PlanFetcherService } from '../../net/plan-fetcher';
import { ParsedPlan } from '../../model/plan';

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
        private planFetcher: PlanFetcherService) {
        this.planObs = this.route.params.pipe(switchMap((params) => this.planFetcher.getCacheValue(params.wd)));
    }

    trackBy(index, substitute) {
        return substitute;
    }
}
