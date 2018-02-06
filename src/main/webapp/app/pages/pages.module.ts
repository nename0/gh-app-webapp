import { NgModule } from '@angular/core';
import { GHAppHomeModule } from './home/home.module';
import { GHAppTagModule } from './tag/tag.module';
import { GHAppErrorModule } from './error/error.module';

@NgModule({
    imports: [
        GHAppErrorModule,
        GHAppHomeModule,
        GHAppTagModule
    ]
})
export class GHAppPagesModule {}
