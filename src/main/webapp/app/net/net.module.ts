import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PlanFetcherService } from './plan-fetcher';
import { ModificationCheckerService } from './modification-checker';
import { ConnectivityService } from './connectivity';
import { WebsocketHandlerService } from './websocket';
import { PushService } from './push';

@NgModule({
    providers: [
        PlanFetcherService,
        ModificationCheckerService,
        ConnectivityService,
        WebsocketHandlerService,
        PushService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppNetModule { }
