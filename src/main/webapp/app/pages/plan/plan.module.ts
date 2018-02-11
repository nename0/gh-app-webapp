import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GHAppSharedModule } from '../../shared';
import { GHAppLayoutsModule } from '../../layouts/layouts.module';
import { PLAN_ROUTE } from './plan.route';
import { PlanComponent } from './plan.component';

@NgModule({
    imports: [
        GHAppSharedModule,
        GHAppLayoutsModule,
        RouterModule.forRoot([ PLAN_ROUTE ], { useHash: true })
    ],
    declarations: [
        PlanComponent
    ],
    entryComponents: [
    ],
    providers: [

    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppPlanModule {}
