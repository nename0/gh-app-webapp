import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MainComponent } from './main/main.component';
import { NavbarComponent } from './navbar/navbar.component';
import { GHAppSharedModule } from '../shared/shared.module';
import { AppBarService } from './main/appbar.service';
import { FeatureDialogService } from 'app/layouts/feature-dialog/feature-dialog.service';
import { FeatureNotificationComponent } from 'app/layouts/feature-dialog/feature-notification-dialog';
import { FeatureFilterComponent } from 'app/layouts/feature-dialog/feature-filter-dialog';
import { AboutDialogComponent } from 'app/layouts/about-dialog/about-dialog';

@NgModule({
    imports: [
        GHAppSharedModule
    ],
    declarations: [
        MainComponent,
        NavbarComponent,
        FeatureNotificationComponent,
        FeatureFilterComponent,
        AboutDialogComponent
    ],
    entryComponents: [
        FeatureNotificationComponent,
        FeatureFilterComponent,
        AboutDialogComponent
    ],
    providers: [
        AppBarService,
        FeatureDialogService
    ],
    exports: [
        MainComponent,
        NavbarComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppLayoutsModule { }
