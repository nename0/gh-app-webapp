import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    templateUrl: './feature-filter-dialog.html',
})
export class FeatureFilterComponent {
    constructor(private router: Router,
        private dialogRef: MatDialogRef<FeatureFilterComponent>,
        private snackBar: MatSnackBar) { }

    close() {
        this.dialogRef.close();
        this.snackBar.open('Filter können in den Einstellungen hinzugefügt werden', null, {
            duration: 3000
        });
    }

    openSettings() {
        this.router.navigate(['/settings']);
        this.dialogRef.close();
    }
}
