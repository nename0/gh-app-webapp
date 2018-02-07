import { NgModule } from '@angular/core';
import { GHAppHomeModule } from './home/home.module';
import { GHAppErrorModule } from './error/error.module';
import { GHAppPlanModule } from './plan/plan.module';

@NgModule({
    imports: [
        GHAppErrorModule,
        GHAppHomeModule,
        GHAppPlanModule
    ]
})
export class GHAppPagesModule {}
