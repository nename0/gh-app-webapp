import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { AuthenticationProviderService } from './auth-provider.service';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';

/**
 * @whatItDoes Conditionally includes an HTML element if current user has any
 * of the authorities passed as the `expression`.
 *
 * @howToUse
 * ```
 *     <some-element *appHasAnyAuthority="'ROLE_ADMIN'">...</some-element>
 *
 *     <some-element *appHasAnyAuthority="['ROLE_ADMIN', 'ROLE_USER']">...</some-element>
 * ```
 */
@Directive({
    selector: '[appHasAnyAuthority]'
})
export class HasAnyAuthorityDirective implements OnDestroy, OnInit {
    private authorities: string[];

    private subscription: Subscription;

    constructor(private authenticationProvider: AuthenticationProviderService,
        private templateRef: TemplateRef<any>,
        private viewContainerRef: ViewContainerRef) {
    }

    ngOnInit(): void {
        this.subscription = this.authenticationProvider.hasAnyAuthority(this.authorities).pipe(distinctUntilChanged())
            .subscribe((result) => {
                if (result) {
                    this.viewContainerRef.createEmbeddedView(this.templateRef);
                } else {
                    this.viewContainerRef.clear();
                }
            });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    @Input()
    set appHasAnyAuthority(value: string | string[]) {
        if (this.authorities) {
            throw new Error('Not allowed to change appHasAnyAuthority value');
        }
        this.authorities = typeof value === 'string' ? [value] : value;
    }
}
