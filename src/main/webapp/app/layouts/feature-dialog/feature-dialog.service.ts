import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FeatureFilterComponent } from 'app/layouts/feature-dialog/feature-filter-dialog';
import { FeatureNotificationComponent } from 'app/layouts/feature-dialog/feature-notification-dialog';
import { PushService, PushStatus } from 'app/net/push';
import { idbKeyVal } from 'app/shared/idbKeyVal';
import { FilterService } from 'app/shared/services/filter.service';
import { take } from 'rxjs/operators';

const KEY_SHOWN_FEATURE_NOTIFICATION_DIALOG = 'shownFeatureNotificationDialog';
const KEY_SHOWN_FEATURE_FILTER_DIALOG = 'shownFeatureFilterDialog';

@Injectable()
export class FeatureDialogService {
    private previousUrl = '';
    private shownNotificationDialog: Promise<boolean>;
    private shownFilterDialog: Promise<boolean>;

    private dialogIsOpen = false;

    constructor(private router: Router,
        private filterService: FilterService,
        private pushService: PushService,
        private matDialog: MatDialog) {
        this.syncKeyValue();
    }

    private syncKeyValue() {
        this.shownNotificationDialog = idbKeyVal.get(KEY_SHOWN_FEATURE_NOTIFICATION_DIALOG)
            .then(Boolean);
        this.shownFilterDialog = idbKeyVal.get(KEY_SHOWN_FEATURE_FILTER_DIALOG)
            .then(Boolean);
    }

    public onRouterResolveEnd() {
        this.previousUrl = this.router.url;
    }

    public onRouterNavigationEnd() {
        if (this.previousUrl.startsWith('/plan/') && this.router.url === '/') {
            console.log('onCanShowDialog');
            if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
                setTimeout(() => this.onCanShowDialog(), 700);
            } else {
                this.onCanShowDialog();
            }
        }
    }

    private async onCanShowDialog() {
        const hasShownNotificationDialog = await this.shownNotificationDialog;
        if (!hasShownNotificationDialog) {
            if (this.pushService.pushStatus.getValue() === PushStatus.DISABLED) {
                this.showNotificationDialog();
                return;
            }
            if (this.pushService.pushStatus.getValue() === PushStatus.ENABLED) {
                idbKeyVal.set(KEY_SHOWN_FEATURE_NOTIFICATION_DIALOG, 'true');
            }
        }
        const hasShownFilterDialog = await this.shownFilterDialog;
        if (!hasShownFilterDialog) {
            const filter = await this.filterService.getSelectedFilters().pipe(take(1)).toPromise();
            console.log('filter ', filter);
            if (filter.length > 0) {
                idbKeyVal.set(KEY_SHOWN_FEATURE_FILTER_DIALOG, 'true');
            } else {
                this.showFilterDialog();
            }
        }
        this.syncKeyValue();
    }

    private showNotificationDialog() {
        this.showDialog(FeatureNotificationComponent)
            .beforeClose().subscribe(() => {
                idbKeyVal.set(KEY_SHOWN_FEATURE_NOTIFICATION_DIALOG, 'true');
                this.syncKeyValue();
            });
    }

    private showFilterDialog() {
        this.showDialog(FeatureFilterComponent)
            .beforeClose().subscribe(() => {
                idbKeyVal.set(KEY_SHOWN_FEATURE_FILTER_DIALOG, 'true');
                this.syncKeyValue();
            });
    }

    private showDialog<T>(component: ComponentType<T>) {
        console.log('showDialog', this.dialogIsOpen, Zone.current.name);
        if (this.dialogIsOpen) {
            return;
        }
        const dialogRef = this.matDialog.open(component);
        console.log('showDialog', dialogRef);
        this.dialogIsOpen = true;
        dialogRef.afterClosed().subscribe((result) => {
            this.dialogIsOpen = false;
        })
        return dialogRef;

    }
}
