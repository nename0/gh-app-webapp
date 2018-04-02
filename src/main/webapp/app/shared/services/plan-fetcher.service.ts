import { Injectable } from '@angular/core';
import { ConnectivityService } from '../../net/connectivity';
import { WEEK_DAYS } from '../../model/weekdays';
import { ParsedPlan } from '../../model/plan';
import { PlanFetcher } from '../../net/plan-fetcher';
import { RxParsedPlan } from '../../model/rx-plan';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter } from 'rxjs/operators';
import { AuthenticationProviderService } from 'app/shared/auth/auth-provider.service';
import { AuthStorageService } from 'app/shared/auth/auth-storage.service';

function KEY_PLAN(wd: string) {
    return 'plan-' + wd;
}

@Injectable()
export class PlanFetcherService extends PlanFetcher {
    public readonly plansCache: { [wd: string]: BehaviorSubject<RxParsedPlan> };

    constructor(private connectivityService: ConnectivityService,
        private authenticationProvider: AuthenticationProviderService,
        authStorageService: AuthStorageService) {
        super(authStorageService);
        this.plansCache = {};
        for (const wd of WEEK_DAYS) {
            this.plansCache[wd] = new BehaviorSubject(undefined);
        }
        this.syncKeyValue();
    }

    protected executeLoadingTask<A, R>(fun: (...args: A[]) => Promise<R>, ...args: A[]): Promise<R> {
        return this.connectivityService.executeLoadingTask(fun, this, ...args);
    }

    protected on401() {
        this.authenticationProvider.gotUnauthorized();
    }

    protected createParsedPlan(obj: any): RxParsedPlan {
        return new RxParsedPlan(obj);
    }

    protected setCacheValue(wd: string, plan: RxParsedPlan) {
        this.plansCache[wd].next(plan);
    }
    protected getCacheValue(wd: string): RxParsedPlan {
        return this.plansCache[wd].getValue();
    }

    public getPlanObservable(weekDay: string) {
        return this.plansCache[weekDay].pipe(filter((value) => !!value));
    }
}
