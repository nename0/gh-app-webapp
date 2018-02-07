import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { UserRouteAccessService } from '../../shared';
import { Injectable } from '@angular/core';
import { getWeekDayDisplayStr } from '../../model/weekdays';
import { PlanComponent } from './plan.component';

@Injectable()
export class PlanResolver implements Resolve<any> {
    constructor(    ) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const data = {
            authorities: [],
            pageTitle: getWeekDayDisplayStr(route.params.wd) + ' Vertretungsplan GH',
        };
        route.data = data;
        return data;
    }
}

export const PLAN_ROUTE: Route = {
    path: 'plan/:wd',
    component: PlanComponent,
    data: {
        authorities: [],
        pageTitle: 'Tag not found'
    },
    resolve: [PlanResolver],
    canActivate: [UserRouteAccessService]
};
