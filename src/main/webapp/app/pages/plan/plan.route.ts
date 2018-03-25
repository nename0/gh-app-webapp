import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { UserRouteAccessService } from '../../shared';
import { Injectable } from '@angular/core';
import { getWeekDayDisplayStr } from '../../model/weekdays';
import { of as Observable_of } from 'rxjs/observable/of';
import { PlanComponent } from './plan.component';
import { ROLE_PUPIL } from 'app/shared/auth/roles';

export const PLAN_ROUTE: Route = {
    path: 'plan/:wd',
    component: PlanComponent,
    data: {
        authorities: [ROLE_PUPIL]
    },
    canActivate: [UserRouteAccessService]
};
