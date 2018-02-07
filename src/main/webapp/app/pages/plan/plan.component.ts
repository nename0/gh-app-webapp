import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DataSource } from '@angular/cdk/table';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material';
import { map } from 'rxjs/operators';
import { switchMapLateUnsubscribe } from '../../shared/rxjs/switchMapLateUnsubscribe';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
    selector: 'app-plan-comp',
    templateUrl: './plan.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class PlanComponent implements OnInit, OnDestroy {
    subscribtion: Subscription;
    readonly tagName: BehaviorSubject<string> = new BehaviorSubject('');

    constructor(private route: ActivatedRoute) {
        //this.dataRows = this.route.data.pipe();
        this.subscribtion = this.route.params.pipe(map((params) => params.name))
            .subscribe(this.tagName);
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscribtion.unsubscribe();
    }
}
