import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { AuthenticationProviderService } from './auth-provider.service';
import { take } from 'rxjs/operators';

@Injectable()
export class UserRouteAccessService implements CanActivate {

    constructor(private authenticationProvider: AuthenticationProviderService) { }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        const authorities = route.data['authorities'] || [];

        const result = await this.authenticationProvider.hasAnyAuthority(authorities)
            .pipe(take(1)).toPromise();
        if (!result) {
            this.authenticationProvider.navigateAccessDenied(state.url);
        }
        return result;
    }
}
