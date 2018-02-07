import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MainComponent } from './main/main.component';
import { NavbarComponent } from './navbar/navbar.component';
import { GHAppSharedModule } from '../shared/shared.module';

@NgModule({
    imports: [
        GHAppSharedModule
    ],
    declarations: [
        MainComponent,
        NavbarComponent,
    ],
    providers: [
    ],
    exports: [
        MainComponent,
        NavbarComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppLayoutsModule {}
