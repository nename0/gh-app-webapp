import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GHAppSharedModule } from '../../shared';
import { HOME_ROUTES, HomeResolver } from './home.route';
import { HomeComponent } from './home.component';

@NgModule({
    imports: [
        GHAppSharedModule,
        RouterModule.forRoot(HOME_ROUTES, { useHash: true })
    ],
    declarations: [
        HomeComponent,
    ],
    entryComponents: [
    ],
    providers: [
        HomeResolver
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppHomeModule {}
