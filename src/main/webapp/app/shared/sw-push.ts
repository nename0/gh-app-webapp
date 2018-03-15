import { PlanFetcher } from '../net/plan-fetcher';
import { ParsedPlan } from '../model/plan';
import { getWeekDayIndex, WEEK_DAYS, getWeekDayShortStr } from '../model/weekdays';
import { idbKeyVal, KEY_LATEST_MODIFICATION_HASH, KEY_LAST_UPDATE, KEY_SELECTED_FILTERS } from './idbKeyVal';
import { ALL_FILTER } from '../model/filter';

declare const self: ServiceWorkerGlobalScope;

const NOTIFICATION_TAG = 'plan-update-v1';

class SWPlanFetcher extends PlanFetcher {
    cache: { [wd: string]: ParsedPlan } = {};

    protected setCacheValue(wd: string, plan: ParsedPlan) {
        this.cache[wd] = plan;
    }
    protected getCacheValue(wd: string): ParsedPlan {
        return this.cache[wd];
    }
}

const planFetcher = new SWPlanFetcher();

export async function handlePushMessage(pushData: any) {
    if (!pushData.days || !pushData.days.length || !pushData.mh) {
        return showNotification('Vertretungspläne geändert',
            'Fehler: expected PushData to have days and mh: ' + JSON.stringify(pushData),
            null);
    }
    const now = new Date();
    idbKeyVal.set(KEY_LATEST_MODIFICATION_HASH, pushData.mh);

    const notification = (await self.registration.getNotifications({ tag: NOTIFICATION_TAG }))[0];
    const notificationData = notification ? (notification['data'] || {}) : {}
    const data = mergeNotificationData(notificationData, pushData);

    let body: string;
    let weekDays: string[] = data.days.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));
    let title = 'Vertretungsplan ' + weekDays.map((wd) => getWeekDayShortStr(wd)).join(', ') + ' geändert';
    if (!notification) {
        await showNotification(title, 'Lade Pläne...', data);
    }
    try {
        await planFetcher.fetchAll();
        const planCache = planFetcher.cache;
        data.days.sort((a, b) => planCache[a].planDate.getTime() - planCache[b].planDate.getTime());
        weekDays = data.days.filter((wd) => new Date(planCache[wd].planDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0));
        if (weekDays.length === 0) {
            weekDays = data.days.slice(-1);
        }
        data.days = weekDays;
        title = 'Vertretungsplan ' + weekDays.map((wd) => getWeekDayShortStr(wd)).join(', ') + ' geändert';

        const selectedFilters = await getSelectedFilters();
        const lines: string[] = [];
        let lineBeginning = '';
        outer:
        for (const wd of weekDays) {
            if (weekDays.length > 1) {
                lineBeginning = getWeekDayShortStr(wd) + ': ';
            }
            for (const filter of selectedFilters) {
                if (!planCache[wd].filtered.filteredSubstitutes[filter]) {
                    continue;
                }
                for (const substitute of planCache[wd].filtered.filteredSubstitutes[filter]) {
                    if (lines.length >= 8) {
                        lines.push('...');
                        break outer;
                    }
                    lines.push(lineBeginning +
                        '| ' + substitute.classText + ' | ' + substitute.lesson + ' | ' + substitute.substitute + ' |');
                    lineBeginning = '';
                }
            }
        }
        body = lines.join('\r\n');
        await idbKeyVal.set(KEY_LAST_UPDATE, now.toUTCString());
    } catch (err) {
        console.log('error while fetching plans in service worker onpush', err);
        body = 'Fehler beim Laden der Pläne';
    }
    // only show if notification is not closed
    if ((await self.registration.getNotifications({ tag: NOTIFICATION_TAG })).length) {
        return showNotification(title, body, data);
    }
}

function mergeNotificationData(notificationData: NotificationData, pushData: any): NotificationData {
    const daysArray = (notificationData.days || []).concat(pushData.days || []);
    const days = Array.from(new Set(daysArray));
    return {
        days
    };
}

async function getSelectedFilters(): Promise<string[]> {
    const result = await idbKeyVal.get(KEY_SELECTED_FILTERS);
    if (result) {
        const value = JSON.parse(result);
        if (value.length) {
            return value;
        }
    }
    return [ALL_FILTER];
}

function showNotification(title: string, body: string, data: NotificationData) {
    return self.registration.showNotification(title, <NotificationOptions>{
        body,
        tag: NOTIFICATION_TAG,
        badge: require('../../content/images/notification-badge.png').substr(1),
        data
    })
}

export async function handleNotificationClick(data: NotificationData) {
    const client = await getControlledWindowClient();
    if (!data.days) {
        console.log('handleNotificationClick: NotificationData did not contain days');
        return openUrl('/#/', client);
    }
    await planFetcher.syncKeyValue();
    const planCache = planFetcher.cache;
    data.days.sort((a, b) => planCache[a].planDate.getTime() - planCache[b].planDate.getTime());
    const weekDays = data.days.filter((wd) => new Date(planCache[wd].planDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0));
    if (weekDays.length) {
        if (client) {
            return openUrl('/#/plan/' + weekDays[0], client);
        }
        return openUrl('/#/?redirect_plan=' + weekDays[0]);
    }
    return openUrl('/#/', client);
}

async function getControlledWindowClient(): Promise<WindowClient> {
    const clients = await self.clients.matchAll({
        type: 'window'
    });
    if (clients.length) {
        return (<WindowClient>clients[0]);
    }
    return undefined;
}

function openUrl(relativeUrl: string, client?: WindowClient) {
    const url = location.origin + relativeUrl;
    if (client) {
        const focusPromise = client.focused ? undefined : client.focus()
        return Promise.all([focusPromise, client.navigate(url)])
    }
    return self.clients.openWindow(url);
}

type NotificationData = {
    days: string[]
}
