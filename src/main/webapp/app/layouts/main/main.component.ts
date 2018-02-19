import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRouteSnapshot, NavigationEnd } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { from as Observable_from } from 'rxjs/observable/from';
import { of as Observable_of } from 'rxjs/observable/of';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs/operators/combineLatest';
import { Subject } from 'rxjs/Subject';
import { observable } from 'rxjs/symbol/observable';
import { AppBarService } from './appbar.service';

export let stickyHeaderOffset: BehaviorSubject<number>;

export let overSmallBreakpoint: BehaviorSubject<boolean>;

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: [
        'main.css'
    ]
})
export class MainComponent implements OnInit {

    @ViewChild('sidenav') sidenav: MatSidenav;
    @ViewChild('scrollpane') scrollpane: ElementRef;

    overSmallBreakpoint: BehaviorSubject<boolean>;
    toolbarOffset: BehaviorSubject<number>;
    toolbarVisible: BehaviorSubject<boolean>;
    titleObs: Observable<string>;
    subtitleObs: Observable<string>;
    hasSubtitleObs: Observable<boolean>;

    constructor(
        private router: Router,
        public media: ObservableMedia,
        private appBarService: AppBarService
    ) {
        // hack to make rxjs belive its an real Observabke
        this.media[observable] = function() { return this; }

        this.titleObs = this.appBarService.titleObs;
        this.subtitleObs = this.appBarService.subtitleObs;
        this.hasSubtitleObs = this.subtitleObs.pipe(map((title) => !!title));
    }

    private getPageTitleOpts(routeSnapshot: ActivatedRouteSnapshot): { title: string, dontSetSubtitle: boolean } {
        let opts; if (routeSnapshot.data && routeSnapshot.data['pageTitle']) {
            opts = {
                title: routeSnapshot.data && routeSnapshot.data['pageTitle'],
                dontSetSubtitle: routeSnapshot.data && routeSnapshot.data['dontSetSubtitle']
            };
        }
        if (routeSnapshot.firstChild) {
            return this.getPageTitleOpts(routeSnapshot.firstChild) || opts;
        }
        return opts;
    }

    ngOnInit() {
        this.overSmallBreakpoint = new BehaviorSubject(
            !this.media.isActive('xs') && !this.media.isActive('sm'));
        overSmallBreakpoint = this.overSmallBreakpoint;
        this.updateSidenav();
        this.media.subscribe((change) => {
            switch (change.mqAlias) {
                case 'xs':
                case 'sm':
                    this.overSmallBreakpoint.next(false);
                    break;
                default:
                    this.overSmallBreakpoint.next(true);
            }
            this.updateSidenav();
        });

        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const titleOpts = this.getPageTitleOpts(this.router.routerState.snapshot.root);
                if (titleOpts) {
                    this.appBarService.setTitle(Observable_of(titleOpts.title));
                    if (!titleOpts.dontSetSubtitle) {
                        this.appBarService.setSubTitle(Observable_of(undefined));
                    }
                }
            }
        });

        const scrollSubject = new Subject();
        let lastScrollPosition = 0;
        this.scrollpane.nativeElement.addEventListener('scroll', (e) => {
            const curScroll: number = e.target.scrollTop;
            const diff = curScroll - lastScrollPosition;
            lastScrollPosition = curScroll;
            if (curScroll < 4 || this.overSmallBreakpoint.getValue()) {
                this.toolbarOffset.next(0);
                this.toolbarVisible.next(true);
                return;
            }
            if (diff !== 0) {
                scrollSubject.next(diff);
            }
        }, { passive: true });
        this.toolbarVisible = new BehaviorSubject(true);
        this.toolbarOffset = new BehaviorSubject(0);
        //stickyHeaderOffset = new BehaviorSubject(0);
        const operator = combineLatest<number, MediaChange>(this.media);
        scrollSubject.pipe(operator)
            .subscribe(([scrollDiff, mediaChange]) => {
                let toolbarOffset = this.toolbarOffset.getValue();
                switch (mediaChange.mqAlias) {
                    case 'xs':
                        if (scrollDiff > 0) {
                            // down scroll
                            toolbarOffset = Math.max(-56, toolbarOffset - scrollDiff);
                            this.toolbarOffset.next(toolbarOffset);
                        } else {
                            // up scroll
                            toolbarOffset = Math.min(0, toolbarOffset - scrollDiff)
                            this.toolbarOffset.next(toolbarOffset);
                        }
                        this.toolbarVisible.next(toolbarOffset > -56);
                        //stickyHeaderOffset.next(toolbarOffset + 56);
                        break;
                    case 'sm':
                        if (scrollDiff > 0) {
                            // down scroll
                            toolbarOffset = Math.max(-64, toolbarOffset - scrollDiff)
                            this.toolbarOffset.next(toolbarOffset);
                        } else {
                            // up scroll
                            toolbarOffset = Math.min(0, toolbarOffset - scrollDiff)
                            this.toolbarOffset.next(toolbarOffset);
                        }
                        this.toolbarVisible.next(toolbarOffset > -64);
                        //stickyHeaderOffset.next(toolbarOffset + 64);
                        break;
                    default:
                        this.toolbarOffset.next(0);
                        this.toolbarVisible.next(true);
                    //stickyHeaderOffset.next(0);
                }
            });
    }

    private updateSidenav() {
        if (this.overSmallBreakpoint.getValue()) {
            this.sidenav.mode = 'side';
            this.sidenav.open();
        } else {
            this.sidenav.mode = 'over';
            this.sidenav.close();
        }
    }

    closeSidenav() {
        if (!this.overSmallBreakpoint.getValue()) {
            this.sidenav.close();
        }
    }
}
