import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { UserRouteAccessService } from '../../shared/index';
import { Injectable } from '@angular/core';
import { ROLE_PUPIL } from 'app/shared/auth/roles';

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

export const HOME_ROUTES: Route[] = [{
    path: '',
    component: HomeComponent,
    data: {
        authorities: [ROLE_PUPIL],
        pageTitle: 'Vertretungsplan GH',
        dontSetSubtitle: true
    },
    canActivate: [UserRouteAccessService],
    resolve: [HomeResolver]
}, {
    path: '**',
    redirectTo: ''
}];
