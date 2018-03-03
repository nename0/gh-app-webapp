export const ALL_FILTER = 'Alle';
export const COMMON_FILTER = 'Allgemein';
export const UNKNOWN_FILTER = 'Unknown';
const Q11_FILTER = 'Q11';
const Q12_FILTER = 'Q12';
const Q13_FILTER = 'Q13';
const CLASS_NUMBERS = ['5', '6', '7', '8', '9', '10'];
const CLASS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const SELECTABLE_FILTERS = [Q11_FILTER, Q12_FILTER, Q13_FILTER];
for (const classNum of CLASS_NUMBERS) {
    for (const letter of CLASS_LETTERS) {
        SELECTABLE_FILTERS.push(classNum + letter);
    }
}

export function isFilterHashFromDate(hash: string, date: Date) {
    if (hash.length !== 34) {
        throw new Error('isFilterHashFromDate: hash has wrong length: ' + hash);
    }
    const utcDate = new Date(date).setUTCHours(0, 0, 0, 0) / (24 * 3600 * 1000);
    const utcDateHash = parseInt(hash.slice(0, 6), 16);
    return utcDate === utcDateHash;
}
