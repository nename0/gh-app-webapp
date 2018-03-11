import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
    imports: [FlexLayoutModule, BrowserAnimationsModule, RouterModule,
        MatButtonModule, MatSidenavModule, MatSlideToggleModule,
        MatToolbarModule, MatIconModule, MatDialogModule,
        MatCardModule, MatProgressSpinnerModule, MatListModule,
        MatMenuModule, MatSnackBarModule, MatSelectModule,
        MatInputModule
    ],
    exports: [
        FormsModule,
        CommonModule,
        DatePipe,
        FlexLayoutModule, BrowserAnimationsModule, RouterModule,
        MatButtonModule, MatSidenavModule, MatSlideToggleModule,
        MatToolbarModule, MatIconModule, MatDialogModule,
        MatCardModule, MatProgressSpinnerModule, MatListModule,
        MatMenuModule, MatSnackBarModule, MatSelectModule,
        MatInputModule
    ],
    providers: [
        DatePipe,
    ]
})
export class GHAppSharedLibsModule { }
