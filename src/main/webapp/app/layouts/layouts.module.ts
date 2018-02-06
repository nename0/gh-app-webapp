import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MainComponent } from './main/main.component';
import { NavbarComponent } from './navbar/navbar.component';
import { PlayerBottomBarComponent } from './player-bottom-bar/player-bottom-bar.component';
import { TrackListComponent } from './track-list/track-list.component';
import { GHAppSharedModule } from '../shared/shared.module';

@NgModule({
    imports: [
        GHAppSharedModule
    ],
    declarations: [
        MainComponent,
        NavbarComponent,
        PlayerBottomBarComponent,
        TrackListComponent
    ],
    providers: [
    ],
    exports: [
        MainComponent,
        NavbarComponent,
        PlayerBottomBarComponent,
        TrackListComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppLayoutsModule {}
