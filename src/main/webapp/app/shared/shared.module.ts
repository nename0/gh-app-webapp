import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';

import {
    GHAppSharedLibsModule,
    LoginModalService,
    JhiLoginDialogComponent
} from './';
import { GHAppLayoutsModule } from '../layouts/layouts.module';
import { AuthenticationProviderService } from './auth/auth-provider.service';
import { StateStorageService } from './auth/state-storage.service';
import { HasAnyAuthorityDirective } from './auth/has-any-authority.directive';

@NgModule({
    imports: [
        CommonModule,
        GHAppSharedLibsModule
    ],
    declarations: [
        JhiLoginDialogComponent,
        HasAnyAuthorityDirective
    ],
    providers: [
        LoginModalService,
        AuthenticationProviderService,
        StateStorageService
    ],
    entryComponents: [JhiLoginDialogComponent],
    exports: [
        CommonModule,
        JhiLoginDialogComponent,
        HasAnyAuthorityDirective,
        GHAppSharedLibsModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class GHAppSharedModule { }
