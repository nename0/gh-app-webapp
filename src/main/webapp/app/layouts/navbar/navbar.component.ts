import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginModalService, JhiLoginDialogComponent } from '../../shared';
import { VERSION, DEBUG_INFO_ENABLED } from '../../app.constants';
import { Observable } from 'rxjs/Observable';
import { AuthenticationProviderService } from '../../shared/auth/auth-provider.service';
import { map } from 'rxjs/operators';
import { UserContext } from '../../shared/auth/auth-priovider';
import { WEEK_DAYS, getWeekDayDisplayStr } from '../../model/weekdays';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: [
        'navbar.css'
    ]
})
export class NavbarComponent {
    @Output() closeSidnav: EventEmitter<any>;
    dialogRef: MatDialogRef<JhiLoginDialogComponent>;
    readonly version: string;
    readonly weekDays: string[];
    readonly weekDayToDisplayString: (wd:  string) => string;

    readonly isAuthenticated: Observable<boolean>;
    readonly userCtx: Observable<UserContext>;

    constructor(
        private authenticationProvider: AuthenticationProviderService,
        private loginModalService: LoginModalService,
        private snackBar: MatSnackBar,
        private router: Router,
    ) {
        this.version = VERSION ? 'v' + VERSION : '';
        this.closeSidnav = new EventEmitter<any>();
        this.closeSidnav.emit();
        this.weekDays = WEEK_DAYS;
        this.weekDayToDisplayString = getWeekDayDisplayStr;

        this.isAuthenticated = authenticationProvider.isAuthenticated;
        this.userCtx = authenticationProvider.userSubject;
    }

    trackBy(index, weekDay) {
        return weekDay;
    }

    login() {
        this.dialogRef = this.loginModalService.open();
    }

    logout() {
        this.authenticationProvider.logout()
            .then(() => this.router.navigate(['']))
            .catch(() => this.snackBar.open('Cannot logout when offline', null, { duration: 3000 }));
    }
}
