//Source: https://github.com/jakearchibald/idb-keyval
//Modifications copyright (C) 2018 Nename0
//Copyright 2016, Jake Archibald
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License.

function handleErrror(req: IDBRequest | IDBTransaction, reject: (reason?: any) => void) {
    req.onerror = function() {
        reject(req.error);
    }
}

class IdbKeyValClass {
    db: Promise<IDBDatabase>;

    constructor() { }

    private getDB() {
        if (!this.db) {
            this.db = new Promise(function(resolve, reject) {
                const openreq = indexedDB.open('keyval-store', 1);
                handleErrror(openreq, reject);
                openreq.onupgradeneeded = function() {
                    // First time setup: create an empty object store
                    openreq.result.createObjectStore('keyval');
                };
                openreq.onsuccess = function() {
                    resolve(openreq.result);
                };
            });
        }
        return this.db;
    }

    private async withStore(type: IDBTransactionMode, callback: (store: IDBObjectStore) => void) {
        const db = await this.getDB();
        await new Promise(function(resolve, reject) {
            const transaction = db.transaction('keyval', type);
            transaction.oncomplete = function() {
                resolve();
            };
            handleErrror(transaction, reject);
            callback(transaction.objectStore('keyval'));
        });
    }

    public async get(key: string): Promise<string> {
        let req: IDBRequest;
        await this.withStore('readonly', function(store) {
            req = store.get(key);
        })
        return req.result;
    }

    public set(key: string, value: string): Promise<void> {
        return this.withStore('readwrite', function(store) {
            store.put(value, key);
        });
    }

    public async cas(key: string, expected: string, value: string): Promise<boolean> {
        if (expected === value) {
            return (await this.get(key) === expected);
        }
        let result: boolean;
        await this.withStore('readwrite', function(store) {
            const getReq = store.get(key);
            getReq.onsuccess = function() {
                if (expected !== getReq.result) {
                    result = false;
                    return;
                }
                store.put(value, key);
                result = true;
            }
        });
        return result;
    }

    public delete(key) {
        return this.withStore('readwrite', function(store) {
            store.delete(key);
        });
    }

    public clear() {
        return this.withStore('readwrite', function(store) {
            store.clear();
        });
    }

    public async keys() {
        const keys = [];
        await this.withStore('readonly', function(store) {
            // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
            // And openKeyCursor isn't supported by Safari.
            (store['openKeyCursor'] || store.openCursor).call(store).onsuccess = function() {
                if (!this.result) {
                    return;
                }
                keys.push(this.result.key);
                this.result.continue();
            };
        });
        return keys;
    };
}

export const idbKeyVal = new IdbKeyValClass();
