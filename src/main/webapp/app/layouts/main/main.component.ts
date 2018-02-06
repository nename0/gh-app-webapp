import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRouteSnapshot, NavigationEnd, RoutesRecognized, ResolveEnd } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { from as Observable_from } from 'rxjs/observable/from';
import { ObservableMedia, MediaChange } from '@angular/flex-layout';
import { MatSidenav } from '@angular/material/sidenav';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs/operators/combineLatest';
import { Subject } from 'rxjs/Subject';
import { observable } from 'rxjs/symbol/observable';

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
    titleObs: BehaviorSubject<string>;

    constructor(
        private router: Router,
        private titleService: Title,
        public media: ObservableMedia
    ) {
        this.media[observable] = function() { return this; }
    }

    private getPageTitle(routeSnapshot: ActivatedRouteSnapshot) {
        let title: string = (routeSnapshot.data && routeSnapshot.data['pageTitle']) ? routeSnapshot.data['pageTitle'] : 'MusicCloud';
        if (routeSnapshot.firstChild) {
            title = this.getPageTitle(routeSnapshot.firstChild) || title;
        }
        return title;
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

        this.titleObs = new BehaviorSubject(this.getPageTitle(this.router.routerState.snapshot.root));
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const title = this.getPageTitle(this.router.routerState.snapshot.root);
                this.titleService.setTitle(title);
                this.titleObs.next(title);
            }
        });

        const scrollSubject = new Subject();
        let lastScrollPosition = 0;
        this.scrollpane.nativeElement.addEventListener('scroll', (e) => {
            const curScroll: number = e.target.scrollTop;
            if (curScroll === lastScrollPosition) { return; }
            scrollSubject.next(curScroll - lastScrollPosition);
            lastScrollPosition = curScroll;
            if (this.overSmallBreakpoint.getValue()) {
                this.toolbarOffset.next(0);
                return;
            }
            let toolbarOffset = this.toolbarOffset.getValue();
            if (curScroll > lastScrollPosition) {
                // down scroll
                if (toolbarOffset > -64) {
                    toolbarOffset = Math.max(-64, toolbarOffset - (curScroll - lastScrollPosition))
                    this.toolbarOffset.next(toolbarOffset);
                }
            } else if (curScroll < lastScrollPosition) {
                // up scroll
                if (toolbarOffset < 0) {
                    toolbarOffset = Math.min(0, toolbarOffset + (lastScrollPosition - curScroll))
                    this.toolbarOffset.next(toolbarOffset);
                }
            }
        }, { passive: true });
        this.toolbarVisible = new BehaviorSubject(true);
        this.toolbarOffset = new BehaviorSubject(0);
        stickyHeaderOffset = new BehaviorSubject(0);
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
                        stickyHeaderOffset.next(toolbarOffset + 56);
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
                        stickyHeaderOffset.next(toolbarOffset + 64);
                        break;
                    default:
                        stickyHeaderOffset.next(0);
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
