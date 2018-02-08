import { Injectable } from '@angular/core';

export const hasWebsocketSupport = typeof WebSocket === 'function';

@Injectable()
export class WebsocketHandlerService {

    constructor() { }
}
