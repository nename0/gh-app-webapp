import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationProviderService } from 'app/shared/auth/auth-provider.service';
import { LoginModalService } from 'app/shared/login/login-modal.service';
import { ModificationCheckerService } from 'app/net/modification-checker';

const CONTENT = [
    126, 76, 88, 95, 94, 72, 90, 90, 94, 86, 65, 67, 88, 84, 88, 86,
    72, 73, 26, 124, 69, 80, 80, 94, 51, 40, 55, 46, 100, 13, 35, 53,
    50, 38, 45, 46, 34, 44, 59, 61, 49, 50, 58, 94, 94, 88, 92, 20, 55,
    41, 35, 41, 53, 58, 54, 43, 64, 200, 66, 39, 5, 11, 15, 2, 4, 73,
    57, 8, 4, 145, 2, 3, 92, 81, 64, 67, 69, 77, 123, 125, 57, 21, 22,
    30, 92, 47, 27, 28, 232, 245, 162, 245, 235, 247, 228, 226, 224,
    232, 230, 255, 233, 227, 160, 130, 154, 156, 152, 216, 251, 251,
    226, 246, 243, 237, 160, 187, 224, 225, 243, 254, 201, 205, 214,
    204, 158, 203, 195, 201, 201, 196, 207, 146, 155, 237, 201, 192,
    223, 214, 222, 214, 217, 212, 223, 219, 150, 218, 213, 214
];

@Component({
    templateUrl: './about-dialog.html'
})
export class AboutDialogComponent implements OnInit {
    content: string;
    link: string;
    linkText: string;

    constructor(private authenticationProvider: AuthenticationProviderService,
        private loginModalService: LoginModalService,
        private modificationChecker: ModificationCheckerService,
        private dialogRef: MatDialogRef<AboutDialogComponent>) { }

    ngOnInit(): void {
        if (!this.authenticationProvider.isAuthenticated.getValue()) {
            setTimeout(() => {
                this.dialogRef.close();
                this.loginModalService.open();
            });
            return;
        }
        this.modificationChecker.latestModificationHash.then((hash) => {
            // tslint:disable-next-line:no-bitwise
            const s = (hash.length ^ 28520) & 19039 ^ 19068;
            // tslint:disable-next-line:no-bitwise
            const str = CONTENT.map((c, i) => String.fromCharCode(c ^ (s + i))).join('');
            const split = str.split('||');
            this.content = split[0];
            this.link = split[1];
            this.linkText = this.link.substring(this.link.indexOf(':') + 1);
        });
    }
}
