import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

  constructor(private gameSvc: GameService, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.gameSvc.player = this.activatedRoute.snapshot.queryParams['player'];
    this.gameSvc.createGame();
    this.gameSvc.registerPlayer();
  }

}
