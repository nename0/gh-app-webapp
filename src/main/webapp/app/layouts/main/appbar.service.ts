import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { of as Observable_of } from 'rxjs/observable/of';
import { Observable } from 'rxjs/Observable';
import { switchAll } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

@Injectable()
export class AppBarService {
    private readonly titleSubject: BehaviorSubject<Observable<string>>;
    public readonly titleObs: Observable<string>;
    private readonly subtitleSubject: BehaviorSubject<Observable<string>>;
    public readonly subtitleObs: Observable<string>;

    constructor(private titleService: Title) {
        this.titleSubject = new BehaviorSubject(Observable_of('Vertretungsplan GH'));
        this.titleObs = this.titleSubject.pipe(switchAll());
        this.subtitleSubject = new BehaviorSubject(Observable_of(undefined));
        this.subtitleObs = this.subtitleSubject.pipe(switchAll());

        this.titleObs.subscribe((title) => this.titleService.setTitle(title));
    }

    public setTitle(obs: Observable<string>) {
        this.titleSubject.next(obs);
    }

    public setSubTitle(obs: Observable<string>) {
        this.subtitleSubject.next(obs);
    }
}
