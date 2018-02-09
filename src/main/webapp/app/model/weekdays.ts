export const WEEK_DAYS = ['mo', 'di', 'mi', 'do', 'fr'];
export const WEEK_DAY_DISPLAY = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

export function getWeekDayIndex(date: Date) {
    // Sunday (0) to Saturday (6)
    const dayInWeek = date.getDay();
    if (dayInWeek === 0 || dayInWeek === 6) {
        return 0; // Monday
    }
    return dayInWeek - 1;
}

export function getWeekDayDisplayStr(wd: string): string {
    return WEEK_DAY_DISPLAY[WEEK_DAYS.indexOf(wd)];
}

export function getWeekDayShortStr(wd: string): string {
    return wd[0].toUpperCase() + wd[1];
}
