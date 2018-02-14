import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { PushService, PushStatus } from '../../net/push';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: [
        'settings.css'
    ]

})
export class SettingsComponent {
    readonly PushStatus = PushStatus;
    readonly pushButtonLoading: BehaviorSubject<boolean>;
    readonly pushButtonDisable: Observable<boolean>;
    readonly pushStatusObs: BehaviorSubject<PushStatus>;

    constructor(public pushService: PushService) {
        this.pushStatusObs = this.pushService.pushStatus;

        this.pushButtonLoading = new BehaviorSubject(false);
        this.pushButtonDisable = combineLatest(this.pushButtonLoading, this.pushStatusObs)
            .pipe(map(([loading, status]) => {
                return loading || status === PushStatus.DENIED || status === PushStatus.NOT_AVALABLE;
            }));
    }

    async pushToggle() {
        this.pushButtonLoading.next(true);
        try {
            await this.pushService.toggle();
        } catch (err) {
            console.log('error in pushService toogle', err);
        }
        this.pushButtonLoading.next(false);
    }
}
