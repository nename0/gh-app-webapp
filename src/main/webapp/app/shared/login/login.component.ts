import { Component, AfterViewInit, Renderer, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationProviderService } from '../auth/auth-provider.service';
import { StateStorageService } from '../auth/state-storage.service';

@Component({
    selector: 'app-login-modal',
    templateUrl: './login.component.html'
})
export class JhiLoginDialogComponent implements AfterViewInit {
    authenticationError: boolean;
    password: string;
    rememberMe: boolean;
    username: string;
    credentials: any;

    constructor(
        private authenticationProvider: AuthenticationProviderService,
        private stateStorageService: StateStorageService,
        private elementRef: ElementRef,
        private renderer: Renderer,
        private router: Router,
        public dialogRef: MatDialogRef<JhiLoginDialogComponent>
    ) {
        this.credentials = {};
    }

    ngAfterViewInit() {
        //this.renderer.invokeElementMethod(this.elementRef.nativeElement.querySelector('#username'), 'focus', []);
    }

    cancel() {
        this.credentials = {
            username: null,
            password: null
        };
        this.authenticationError = false;
        this.dialogRef.close('cancel');
    }

    login() {
        this.username = (this.username || '').trim();
        this.authenticationProvider.login({
            username: this.username,
            password: this.password
        }).then(() => {
            this.authenticationError = false;
            this.dialogRef.close('login success');

            const redirect = this.stateStorageService.getUrl();
            if (redirect) {
                this.stateStorageService.storeUrl(null);
                this.router.navigate([redirect]);
            } else {
                this.router.navigate(['']);
            }

        }).catch(() => {
            this.authenticationError = true;
        });
    }
}
