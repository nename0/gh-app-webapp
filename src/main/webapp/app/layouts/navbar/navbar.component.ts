import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoginModalService, JhiLoginDialogComponent } from '../../shared';

import { VERSION, DEBUG_INFO_ENABLED } from '../../app.constants';
import { Observable } from 'rxjs/Observable';
import { TagsCacheService } from '../../cache/tags-cache.service';
import { AuthenticationProviderService } from '../../shared/auth/auth-provider.service';
import { map } from 'rxjs/operators';
import { UserContext } from '../../shared/auth/auth-priovider';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: [
        'navbar.css'
    ]
})
export class NavbarComponent {

    @Output() closeSidnav: EventEmitter<any>;
    inProduction: boolean;
    dialogRef: MatDialogRef<JhiLoginDialogComponent>;
    version: string;

    readonly allTags: Observable<Array<string>>;
    readonly isAuthenticated: Observable<boolean>;
    readonly userCtx: Observable<UserContext>;

    constructor(
        private authenticationProvider: AuthenticationProviderService,
        private loginModalService: LoginModalService,
        private snackBar: MatSnackBar,
        private router: Router,
        tagsCacheService: TagsCacheService
    ) {
        this.version = VERSION ? 'v' + VERSION : '';
        this.closeSidnav = new EventEmitter<any>();
        this.closeSidnav.emit();

        this.allTags = tagsCacheService.allTags;
        this.isAuthenticated = authenticationProvider.isAuthenticated;
        this.userCtx = authenticationProvider.userSubject;
    }

    trackBy(index, tagName) {
        return tagName;
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
