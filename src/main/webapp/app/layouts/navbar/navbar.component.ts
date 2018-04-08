import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { LoginModalService, JhiLoginDialogComponent } from '../../shared';
import { VERSION, DEBUG_INFO_ENABLED } from '../../app.constants';
import { Observable } from 'rxjs/Observable';
import { AuthenticationProviderService } from '../../shared/auth/auth-provider.service';
import { map } from 'rxjs/operators';
import { WEEK_DAYS, getWeekDayDisplayStr } from '../../model/weekdays';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: [
        'navbar.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class NavbarComponent {
    @Output() closeSidnav: EventEmitter<any>;
    dialogRef: MatDialogRef<JhiLoginDialogComponent>;
    readonly weekDays: string[];
    readonly weekDayToDisplayString: (wd:  string) => string;

    readonly isAuthenticated: Observable<boolean>;

    constructor(
        private authenticationProvider: AuthenticationProviderService,
        private loginModalService: LoginModalService,
        private router: Router,
    ) {
        this.closeSidnav = new EventEmitter<any>();
        this.closeSidnav.emit();
        this.weekDays = WEEK_DAYS;
        this.weekDayToDisplayString = getWeekDayDisplayStr;

        this.isAuthenticated = authenticationProvider.isAuthenticated;
    }

    trackBy(index, weekDay) {
        return weekDay;
    }

    login() {
        this.dialogRef = this.loginModalService.open();
    }

    logout() {
        this.authenticationProvider.logout();
    }
}
