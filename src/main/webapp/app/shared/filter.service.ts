import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { idbKeyVal } from './idbKeyVal';
import { SELECTABLE_FILTERS } from '../model/filter';

const KEY_SELECTED_FILTERS = 'selectedFilters';

@Injectable()
export class FilterService {
    public readonly selectedFilters: BehaviorSubject<string[]> = new BehaviorSubject([]);

    constructor() {
        this.syncKeyValue();
    }

    private syncKeyValue() {
        return idbKeyVal.get(KEY_SELECTED_FILTERS)
            .then((result) => {
                if (!result) {
                    return idbKeyVal.set(KEY_SELECTED_FILTERS, JSON.stringify([]));
                }
                const value = this.normalizeFilters(JSON.parse(result));
                this.selectedFilters.next(value);
            });
    }

    public async addFilter(filter: string) {
        while (true) {
            const expected = this.selectedFilters.getValue();
            const newValue = this.normalizeFilters(expected, filter);
            const expectedStr = JSON.stringify(expected);
            const newStr = JSON.stringify(newValue);
            if (expectedStr === newStr) {
                this.selectedFilters.next(expected);
                return;
            }
            if (await idbKeyVal.cas(KEY_SELECTED_FILTERS, expectedStr, newStr)) {
                this.selectedFilters.next(newValue);
                return;
            }
            await this.syncKeyValue();
        }
    }

    public async removeFilter(filter: string) {
        while (true) {
            const expected = this.selectedFilters.getValue();
            const newValue = expected.filter((f) => f !== filter);
            const expectedStr = JSON.stringify(expected);
            const newStr = JSON.stringify(newValue);
            if (expectedStr === newStr) {
                this.selectedFilters.next(expected);
                return;
            }
            if (await idbKeyVal.cas(KEY_SELECTED_FILTERS, expectedStr, newStr)) {
                this.selectedFilters.next(newValue);
                return;
            }
            await this.syncKeyValue();
        }
    }

    private normalizeFilters(filters: string[], toAdd?: string) {
        const set = new Set(filters);
        if (toAdd) {
            set.add(toAdd);
        }
        const removedDupplicated = Array.from(set);
        return removedDupplicated.filter((filter) => SELECTABLE_FILTERS.includes(filter))
    }
}
