import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ModificationCheckerService } from './modification-checker';
import { ConnectivityService } from './connectivity';
import { WebsocketHandlerService } from './websocket';
import { PushService } from './push';

@NgModule({
    providers: [
        ModificationCheckerService,
        ConnectivityService,
        PushService,
        WebsocketHandlerService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GHAppNetModule { }
