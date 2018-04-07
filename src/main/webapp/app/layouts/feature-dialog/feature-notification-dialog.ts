import { Component } from '@angular/core';
import { PushService, PushStatus } from 'app/net/push';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    templateUrl: './feature-notification-dialog.html',
})
export class FeatureNotificationComponent {
    constructor(private pushService: PushService,
        private router: Router,
        private dialogRef: MatDialogRef<FeatureNotificationComponent>,
        private snackBar: MatSnackBar) { }

    close() {
        this.dialogRef.close();
        this.snackBar.open('Benachrichtigungen können in den Einstellungen aktiviert werden', null, {
            duration: 3000
        });
    }

    enableNotifications() {
        if (this.pushService.pushStatus.getValue() === PushStatus.DISABLED) {
            this.pushService.toggle();
        }
        this.router.navigate(['/settings']);
        this.dialogRef.close();
    }
}
