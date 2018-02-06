import { Route } from '@angular/router';
import { HomeComponent } from './home.component';
import { UserRouteAccessService } from '../../shared/index';

export const HOME_ROUTE: Route = {
    path: '',
    component: HomeComponent,
    data: {
        authorities: [],
        pageTitle: 'Vertretungsplan GH'
    },
    canActivate: [UserRouteAccessService]
};
