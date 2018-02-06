import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';

@NgModule({
    imports: [FlexLayoutModule, BrowserAnimationsModule, RouterModule,
        MatButtonModule, MatCheckboxModule, MatSidenavModule,
        MatToolbarModule, MatIconModule, MatDialogModule, MatProgressBarModule,
        MatCardModule, MatProgressSpinnerModule, MatListModule, MatTableModule,
        MatSortModule, MatMenuModule, MatFormFieldModule, MatSnackBarModule,
        MatInputModule,
    ],
    exports: [
        FormsModule,
        HttpModule,
        CommonModule,
        DatePipe,
        FlexLayoutModule, BrowserAnimationsModule, RouterModule,
        MatButtonModule, MatCheckboxModule, MatSidenavModule,
        MatToolbarModule, MatIconModule, MatDialogModule, MatProgressBarModule,
        MatCardModule, MatProgressSpinnerModule, MatListModule, MatTableModule,
        MatSortModule, MatMenuModule, MatFormFieldModule, MatSnackBarModule,
        MatInputModule,
    ],
    providers: [
        DatePipe,
    ]
})
export class GHAppSharedLibsModule { }
