import * as idbKeyVal from 'idb-keyval';

function checkStatus(res: Response) {
    if (res.status >= 200 && res.status < 300) {
        return res;
    } else {
        throw new Error(res.url + ' ' + res.statusText);
    }
}

class ModificationCheckerClass {

    constructor() {
        fetch(window.location.origin + ' /api/v1/plans/getLatestModification', {
            credentials: 'same-origin'
        })
            .then(checkStatus)
            .then((res) => {
                res.headers
        })
    }
}

export const ModificationChecker = new ModificationCheckerClass();