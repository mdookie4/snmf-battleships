import { Component, OnInit } from '@angular/core';
import { Ranking } from '../models/model';
import { GameService } from '../services/game.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.css']
})
export class RankingsComponent implements OnInit {

  error: string = null;

  rankingResults: Ranking[] = [];

  constructor(private gameSvc: GameService) { }

  ngOnInit(): void {
    this.onGetRankings();
  }

  async onGetRankings() {
    console.info("get rankings");
    let rankObs: Observable<any>;
    rankObs = await this.gameSvc.getRankings();
    rankObs.subscribe(
      resData => {
        this.rankingResults = resData.map(r=> {
            return {
              playerId: r['player_id'],
              playerHits: r['player_hits'],
              playerMisses: r['player_misses'],
              playerShots: r['player_shots']
              } as Ranking
            })
        console.info(">>>ranking results: ", this.rankingResults);
      },
      errorMessage => {
        console.log(errorMessage.error.message);
        this.error = errorMessage.error.message;
      }
    )
  }

}
