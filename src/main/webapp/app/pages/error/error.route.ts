import {Routes} from '@angular/router';

import {ErrorComponent} from './error.component';

export const ERROR_ROUTE: Routes = [
    {
        path: 'error',
        component: ErrorComponent,
        data: {
            authorities: [],
            pageTitle: 'Fehlerseite!'
        }
    },
    {
        path: 'access_denied',
        component: ErrorComponent,
        data: {
            authorities: [],
            pageTitle: 'Zugriff verweigert!',
            error403: true
        },
    }
];
