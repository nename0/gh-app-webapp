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
        path: 'accessdenied',
        component: ErrorComponent,
        data: {
            authorities: [],
            pageTitle: 'Zugriff verweigert!',
            error403: true
        },
    }
];
