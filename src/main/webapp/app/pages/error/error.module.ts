import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GHAppSharedModule } from '../../shared';
import { ERROR_ROUTE } from './error.route';
import { ErrorComponent } from './error.component';

@NgModule({
    imports: [
        GHAppSharedModule,
        RouterModule.forRoot(ERROR_ROUTE, { useHash: true })
    ],
    declarations: [
        ErrorComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppErrorModule { }
