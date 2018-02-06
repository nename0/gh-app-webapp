import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { LoginModalService } from '../login/login-modal.service';
import { AuthenticationProviderService } from './auth-provider.service';
import { take } from 'rxjs/operators';
import { StateStorageService } from './state-storage.service';

@Injectable()
export class UserRouteAccessService implements CanActivate {

    constructor(private authenticationProvider: AuthenticationProviderService,
        private loginModalService: LoginModalService,
        private router: Router,
        private stateStorage: StateStorageService
    ) {
     }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        const authorities = route.data['authorities'] || [];

        const result = await this.authenticationProvider.hasAnyAuthority(authorities)
            .pipe(take(1)).toPromise();
        if (!result) {
            this.stateStorage.storeUrl(state.url);
            this.router.navigate(['accessdenied']).then(() => {
                // only show the login dialog, if the user hasn't logged in yet
                if (!this.authenticationProvider.isAuthenticated.getValue()) {
                    this.loginModalService.open();
                }
            });
        }
        return result;
    }
}
