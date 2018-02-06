import { Component, OnInit, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Track } from '../../model/readonly.models';
import { PlayerService } from '../../player/player.service';
import { switchMapLateUnsubscribe } from '../../shared/rxjs/switchMapLateUnsubscribe';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-player-bottom-bar',
    templateUrl: './player-bottom-bar.component.html',
    styleUrls: [
        'player-bottom-bar.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush // Because we only use Observables
})
export class PlayerBottomBarComponent implements OnInit {

    readonly playingTrack: Observable<Track>;

    readonly artistStr: Observable<string>;

    constructor(
        private router: Router,
        public playerService: PlayerService,
    ) {
        this.playingTrack = playerService.playerQueue.playingTrack;
        this.artistStr = this.playingTrack.pipe(
            distinctUntilChanged(), // the artistStrObs stays the same on same Track
            switchMapLateUnsubscribe((track: Track) => track.artistsStr));
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof RoutesRecognized) {
                // TODO deactivate on state player detail
            }
        });
    }
}
