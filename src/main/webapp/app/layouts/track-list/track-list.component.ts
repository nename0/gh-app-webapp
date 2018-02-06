import { Component, ChangeDetectionStrategy, ViewChild, OnInit, Input, ElementRef, OnDestroy } from '@angular/core';
import { Track } from '../../model/readonly.models';
import { MatSort, Sort } from '@angular/material/sort';
import { MenuPositionX, MatMenuTrigger } from '@angular/material/menu';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { stickyHeaderOffset, overSmallBreakpoint } from '../main/main.component';
import { combineLatest, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { TrackListDataRow, sortDataRow } from '../../model/track-list-row';

@Component({
    selector: 'app-track-list',
    templateUrl: './track-list.component.html',
    styleUrls: ['./track-list.css'],
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class TrackListComponent implements OnInit, OnDestroy {
    @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;
    @ViewChild('contextMenuAnchor') contextMenuAnchor: ElementRef;
    contextMenuTrackId: string;

    @ViewChild(MatSort) sort: MatSort;
    @Input() readonly defaultSort: Sort = null;
    @Input() dateColumnName: string = null;
    readonly displayedColumnsSmall = ['play', 'name'];
    readonly displayedColumnsLarge = ['play', 'name', 'artists', 'album'];

    @Input() readonly dataRows: Observable<TrackListDataRow[]>;
    @Input() readonly playRowCallback: (row: TrackListDataRow, sort: Sort, index: number) => void;
    dataSource: MyDataSource;

    stickyHeaderOffset: Observable<number>;
    overSmallBreakpoint: BehaviorSubject<boolean>;

    constructor() { }

    ngOnInit(): void {
        this.overSmallBreakpoint = overSmallBreakpoint;
        if (this.dateColumnName != null) {
            this.displayedColumnsSmall.push('date');
            this.displayedColumnsLarge.push('date');
        }
        this.dataSource = new MyDataSource(this.dataRows, this.sort.sortChange);
        this.sort.active = this.defaultSort.active;
        this.sort.direction = this.defaultSort.direction;
        this.sort.sortChange.next(this.defaultSort);
        // move anchor to body so we can use page coordinates
        document.body.appendChild(this.contextMenuAnchor.nativeElement);
        // we need to move our sticky header if toolbar is sticky
        this.stickyHeaderOffset = stickyHeaderOffset;
    }

    ngOnDestroy(): void {
        this.contextMenuAnchor.nativeElement.remove();
    }

    trackBy(index: number, elem: TrackListDataRow) {
        return elem._id;
    }

    onContextMenu(event: MouseEvent, track: TrackListDataRow) {
        event.preventDefault();
        if (this.contextMenu.menuOpen) {
            this.contextMenu.closeMenu();
            this.contextMenuTrackId = null;
        } else {
            // faster than using angular
            this.contextMenuAnchor.nativeElement.style.left = event.pageX + 'px';
            this.contextMenuAnchor.nativeElement.style.top = event.pageY + 'px';

            this.contextMenuTrackId = track._id;
            this.contextMenu.openMenu();
            this.contextMenu.menu.setElevation(8);

            (<any>this.contextMenu)._overlayRef._backdropElement.addEventListener('contextmenu', (event2: MouseEvent) => {
                event2.preventDefault();
                this.contextMenu.closeMenu();
                this.contextMenuTrackId = null;
            }, { once: true });
        }
    }

    addToPlayingQueue() {
        if (this.contextMenuTrackId == null) {
            throw new Error('TrackListComponent: addToPlayingQueue called, but contextMenuTrackId not set');
        }
    }

    getSort(): Sort {
        return {
            active: this.sort.active,
            direction: this.sort.direction
        }
    }
}

class MyDataSource implements DataSource<TrackListDataRow> {
    subscription: Subscription;

    readonly obs: BehaviorSubject<TrackListDataRow[]>;

    constructor(readonly tracks: Observable<TrackListDataRow[]>, readonly sortChange: Subject<Sort>) {
        this.obs = new BehaviorSubject([]);
        this.subscription = tracks.pipe(combineLatest(sortChange),
            map(sortDataRow))
            .subscribe(this.obs);
    }

    connect(collectionViewer: CollectionViewer): Observable<TrackListDataRow[]> {
        return this.obs;
    }
    disconnect(collectionViewer: CollectionViewer): void {
        this.subscription.unsubscribe();
    }

}
