import './css.ts';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GHAppSharedModule, UserRouteAccessService } from './shared';
import { RouterModule } from '@angular/router';

import { MainComponent } from './layouts/main/main.component';
import { GHAppPagesModule } from './pages/pages.module';
import { GHAppLayoutsModule } from './layouts/layouts.module';
import { GHAppNetModule } from './net/net.module';

@NgModule({
    imports: [
        BrowserModule,
        GHAppSharedModule,
        GHAppNetModule,
        GHAppLayoutsModule,
        GHAppPagesModule
    ],
    providers: [
        UserRouteAccessService
    ],
    exports: [
        GHAppSharedModule,
        GHAppLayoutsModule,
    ],
    bootstrap: [MainComponent]
})
export class GHAppModule {
    constructor(
        private modificationChecker: ModificationCheckerService,
        private pushService: PushService
    ) {
        // to load services
    }
}

import runtime from 'serviceworker-webpack-plugin/lib/runtime';
import { PushService } from './net/push';
import { ModificationCheckerService } from './net/modification-checker';

if ('serviceWorker' in navigator) {
    runtime.register().catch(function(err) {
        console.log('service worker registering error', err);
        //alert('service worker registering Error: ' + err.toString());
    });
} else {
    console.log('serviceWorker not supported');
    document.documentElement.setAttribute('manifest', './manifest.v2.appcache');
}
