import { subscribeToResult } from 'rxjs/util/subscribeToResult'
import { ObservableInput, Observable } from 'rxjs/Observable';
import { OuterSubscriber } from 'rxjs/OuterSubscriber';
import { InnerSubscriber } from 'rxjs/InnerSubscriber';
import { Operator } from 'rxjs/Operator';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';

/* tslint:disable:max-line-length */
export function switchMapLateUnsubscribe<T, R>(project: (value: T, index: number) => ObservableInput<R>): (source: Observable<T>) => Observable<R> {
    return function(source: Observable<T>) {
        return source.lift(new SwitchMapLateUnsubOperator(project));
    }
}
/* tslint:enable:max-line-length */

class SwitchMapLateUnsubOperator<T, I, R> implements Operator<T, I> {
    constructor(private project: (value: T, index: number) => ObservableInput<I>) {
    }

    call(subscriber: Subscriber<I>, source: any): any {
        return source.subscribe(new SwitchMapLateUnsubSubscriber(subscriber, this.project));
    }
}

class SwitchMapLateUnsubSubscriber<T, I, R> extends OuterSubscriber<T, I> {
    private index: number = 0;
    private currentInnerSubscription: Subscription;
    private oldInnerSubscription: Subscription;

    constructor(destination: Subscriber<I>,
        private project: (value: T, index: number) => ObservableInput<I>) {
        super(destination);
    }

    protected _next(value: T) {
        let result: ObservableInput<I>;
        const index = this.index++;
        try {
            result = this.project(value, index);
        } catch (error) {
            this.destination.error(error);
            return;
        }
        this._innerSub(result, value, index);
    }

    private _innerSub(result: ObservableInput<I>, value: T, index: number) {
        if (this.oldInnerSubscription) {
            this.oldInnerSubscription.unsubscribe();
        }
        this.oldInnerSubscription = this.currentInnerSubscription;
        this.add(this.currentInnerSubscription = subscribeToResult(this, result, value, index));
    }

    protected _complete(): void {
        const { currentInnerSubscription } = this;
        if (!currentInnerSubscription || currentInnerSubscription.closed) {
            super._complete();
        }
    }

    protected _unsubscribe() {
        this.currentInnerSubscription = null;
    }

    notifyComplete(innerSub: Subscription): void {
        this.remove(innerSub);
        if (innerSub === this.currentInnerSubscription) {
            this.currentInnerSubscription = null;
            if (this.isStopped) {
                super._complete();
            }
        }
    }

    notifyNext(outerValue: T, innerValue: I,
        outerIndex: number, innerIndex: number,
        innerSub: InnerSubscriber<T, I>): void {

        // ensure only lastest outer observable can emit items
        if (outerIndex + 1 === this.index) {
            this.destination.next(innerValue);
            if (this.oldInnerSubscription) {
                this.oldInnerSubscription.unsubscribe();
                this.oldInnerSubscription = null;
            }
        }
    }
}
