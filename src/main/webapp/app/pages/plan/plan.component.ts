import { Component, OnInit, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Track } from '../../model/readonly.models';
import { DataSource } from '@angular/cdk/table';
import { CollectionViewer } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material';
import { map } from 'rxjs/operators';
import { switchMapLateUnsubscribe } from '../../shared/rxjs/switchMapLateUnsubscribe';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TrackListDataRow } from '../../model/track-list-row';

@Component({
    selector: 'app-plan-comp',
    templateUrl: './tag.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class PlanComponent implements OnInit, OnDestroy {
    readonly defaultSort: Sort = {
        active: 'date',
        direction: 'asc'
    }

    readonly dataRows: Observable<TrackListDataRow[]>;

    subscribtion: Subscription;
    readonly tagName: BehaviorSubject<string> = new BehaviorSubject('');
    private playerQueue: PlayerQueue

    constructor(private route: ActivatedRoute,
        private tagsCacheService: TagsCacheService,
        playerService: PlayerService) {
        this.playerQueue = playerService.playerQueue;
        this.dataRows = this.route.data.pipe(
            switchMapLateUnsubscribe((data) =>
                <Observable<TrackListDataRow[]>>data.observable
            ));
        this.subscribtion = this.route.params.pipe(map((params) => params.name))
            .subscribe(this.tagName);
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscribtion.unsubscribe();
    }

    // tslint:disable-next-line:space-before-function-paren
    playRowCallback = async (dataRow: TrackListDataRow, sort: Sort, index: number) => {
        const tagTracks = await this.tagsCacheService.getDataRows(this.tagName.getValue());
        const generator = new TagShuffleGenerator(this.playerQueue, tagTracks, sort);
        this.playerQueue.changePlayback(generator, dataRow._id);
    }
}
