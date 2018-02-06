import { MonoTypeOperatorFunction } from 'rxjs/interfaces';
import { TeardownLogic } from 'rxjs/Subscription';
import { refCount, multicast } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Operator } from 'rxjs/Operator';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Subscriber } from 'rxjs/Subscriber';

export function cacheWhileSubscribed<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) => source.lift(new CacheWhileSubscribedOperator());
}

class CacheWhileSubscribedOperator<T> implements Operator<T, T> {
    subject: Subject<T>;
    subscription: Subscription;
    value: T;

    call(subscriber: Subscriber<T>, source: Observable<T>): TeardownLogic {
        if (!this.subject) {
            this.subject = new Subject<T>();
        }

        const innerSub = this.subject.subscribe(subscriber);
        if (!this.subscription) {
            this.subscription = source.subscribe(
                (value) => {
                    this.value = value;
                    this.subject.next(value);
                },
                (err) => {
                    this.subject.error(err);
                    this.reset();
                },
                () => {
                    this.subject.complete();
                    this.reset();
                });
        } else if ('value' in this) {
            subscriber.next(this.value);
        }

        innerSub.add(() => {
            if (this.subject.observers.length === 0) {
                this.reset();
            }
        });
    }

    reset() {
        this.subject = null;
        delete this.value;
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}
