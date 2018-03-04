import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { UserRouteAccessService } from '../../shared/index';
import { Injectable } from '@angular/core';

@Injectable()
export class HomeResolver implements Resolve<any> {
    constructor(private router: Router) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if ('redirect_plan' in route.queryParams) {
            const weekDay = route.queryParams['redirect_plan'];
            window.history.replaceState(null, null, '/#/');
            this.router.navigate(['plan/' + weekDay]);
        }
    }
}

export const HOME_ROUTE: Route = {
    path: '',
    component: HomeComponent,
    data: {
        authorities: [],
        pageTitle: 'Vertretungsplan GH',
        dontSetSubtitle: true
    },
    canActivate: [UserRouteAccessService],
    resolve: [HomeResolver]
};
