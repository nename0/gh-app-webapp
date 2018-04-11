import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { of as Observable_of } from 'rxjs/observable/of';
import { Observable } from 'rxjs/Observable';
import { switchAll, combineLatest, map } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { ModificationCheckerService } from 'app/net/modification-checker';
import { ConnectivityService } from 'app/net/connectivity';

@Injectable()
export class AppBarService {
    private readonly titleSubject: BehaviorSubject<Observable<string>>;
    public readonly titleObs: Observable<string>;
    private readonly subtitleSubject: BehaviorSubject<Observable<string>>;
    public readonly subtitleObs: Observable<string>;

    constructor(private titleService: Title,
        private router: Router,
        private modificationChecker: ModificationCheckerService,
        private connectivity: ConnectivityService) {
        this.titleSubject = new BehaviorSubject(Observable_of('Vertretungsplan GH'));
        this.titleObs = this.titleSubject.pipe(switchAll());
        this.subtitleSubject = new BehaviorSubject(Observable_of(undefined));
        this.subtitleObs = this.subtitleSubject.pipe(switchAll(),
            combineLatest(modificationChecker.loadingPlans),
            map(([subtitle, loadingPlans]) => {
                return loadingPlans && connectivity.isOnline.getValue() ?
                    'Lade Pläne...' : subtitle;
            }));

        this.titleObs.subscribe((title) => {
            if (title !== 'Vertretungsplan GH') {
                title += ' - Vertretungsplan GH';
            }
            this.titleService.setTitle(title);
        });
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

    public onRouterNavigationEnd() {
        const titleOpts = this.getPageTitleOpts(this.router.routerState.snapshot.root);
        if (titleOpts) {
            this.setTitle(Observable_of(titleOpts.title));
            if (!titleOpts.dontSetSubtitle) {
                this.setSubTitle(Observable_of(undefined));
            }
        }
    }

    public setTitle(obs: Observable<string>) {
        this.titleSubject.next(obs);
    }

    public setSubTitle(obs: Observable<string>) {
        this.subtitleSubject.next(obs);
    }
}
