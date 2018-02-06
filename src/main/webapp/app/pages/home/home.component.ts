import { Component, OnInit } from '@angular/core';

import { LoginModalService, JhiLoginDialogComponent } from '../../shared';
import { MatDialogRef } from '@angular/material';
import { take } from 'rxjs/operators';
import { cacheWhileSubscribed } from '../../shared/rxjs/cacheWhileSubscribed';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: [
        'home.css'
    ]

})
export class HomeComponent implements OnInit {
    account: Account;
    dialogRef: MatDialogRef<JhiLoginDialogComponent>;

    constructor(
        private loginModalService: LoginModalService,
    ) {
    }

    ngOnInit() {
    }

    login() {
        this.dialogRef = this.loginModalService.open();
    }
}
