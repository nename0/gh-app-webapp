import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { PushService, PushStatus } from '../../net/push';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { SELECTABLE_FILTERS } from '../../model/filter';
import { FilterService } from '../../shared/services/filter.service';
import { MatSelect } from '@angular/material/select';

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
    readonly pushHasErrored: BehaviorSubject<number>;

    readonly SELECTABLE_FILTERS = SELECTABLE_FILTERS;
    readonly selectedFilters: BehaviorSubject<string[]>;

    constructor(public pushService: PushService,
        private filterService: FilterService) {
        this.pushStatusObs = this.pushService.pushStatus;
        this.pushHasErrored = this.pushService.hasErrored;

        this.pushButtonLoading = new BehaviorSubject(false);
        this.pushButtonDisable = combineLatest(this.pushButtonLoading, this.pushStatusObs)
            .pipe(map(([loading, status]) => {
                return loading || status === PushStatus.DENIED || status === PushStatus.NOT_AVALABLE;
            }));

        this.selectedFilters = this.filterService.selectedFilters;
    }

    trackBy(index, filter) {
        return filter;
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

    addFilter(select: MatSelect) {
        if (select.empty) {
            return;
        }
        this.filterService.addFilter(select.value);
        select.writeValue(null);
    }

    removeFilter(filter: string) {
        this.filterService.removeFilter(filter);
    }
}
