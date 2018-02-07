import { Component, OnInit } from '@angular/core';
import { LoginModalService, JhiLoginDialogComponent } from '../../shared';
import { MatDialogRef } from '@angular/material';
import { take } from 'rxjs/operators';
import { cacheWhileSubscribed } from '../../shared/rxjs/cacheWhileSubscribed';
import { WEEK_DAYS, getWeekDayDisplayStr } from '../../model/weekdays';
import { Router } from '@angular/router';
import { ModificationChecker } from '../../net/modification-checker';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: [
        'home.css'
    ]

})
export class HomeComponent {
    readonly weekDays: string[];
    readonly weekDayToDisplayString: (wd: string) => string;

    constructor(
        private router: Router
    ) {
        this.weekDays = WEEK_DAYS;
        this.weekDayToDisplayString = getWeekDayDisplayStr;

        const x = ModificationChecker.lastModificationFetched;
    }

    trackBy(index, weekDay) {
        return weekDay;
    }

    onclick(weekday: string) {
        this.router.navigate(['/plan/' + weekday]);
    }
}
