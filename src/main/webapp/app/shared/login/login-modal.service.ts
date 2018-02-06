import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';

import { JhiLoginDialogComponent } from './login.component';

@Injectable()
export class LoginModalService {
    private isOpen = false;
    constructor(
        private dialog: MatDialog
    ) {}

    open(): MatDialogRef<JhiLoginDialogComponent> {
        if (this.isOpen) {
            return;
        }
        const dialogRef = this.dialog.open(JhiLoginDialogComponent);
        this.isOpen = true;
        dialogRef.afterClosed().subscribe((result) => {
            this.isOpen = false;
        })
        return dialogRef;
    }
}
