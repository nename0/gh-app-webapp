import { Route } from '@angular/router';
import { UserRouteAccessService } from '../../shared/index';
import { SettingsComponent } from './settings.component';

export const SETTINGS_ROUTE: Route = {
    path: 'settings',
    component: SettingsComponent,
    data: {
        authorities: [],
        pageTitle: 'Einstellungen'
    },
    canActivate: [UserRouteAccessService]
};
