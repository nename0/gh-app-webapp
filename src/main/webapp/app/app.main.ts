import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { GHAppModule } from './app.module';
import { enableProdMode } from '@angular/core';
import { DEBUG_INFO_ENABLED } from './app.constants';

if (!DEBUG_INFO_ENABLED) {
    enableProdMode();
} else if (module['hot']) {
    module['hot'].accept();
}

platformBrowserDynamic().bootstrapModule(GHAppModule)
    .then((success) => console.log(`Application started`))
    .catch((err) => console.error(err));
