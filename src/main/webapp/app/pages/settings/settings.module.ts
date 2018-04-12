import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GHAppSharedModule } from '../../shared';
import { SettingsComponent } from './settings.component';
import { SETTINGS_ROUTE } from './settings.route';
import { IOSDialogComponent } from 'app/pages/settings/ios-dialog';

@NgModule({
    imports: [
        GHAppSharedModule,
        RouterModule.forRoot([ SETTINGS_ROUTE ], { useHash: true })
    ],
    declarations: [
        SettingsComponent,
        IOSDialogComponent
    ],
    entryComponents: [
        IOSDialogComponent
    ],
    providers: [
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppSettingsModule {}
