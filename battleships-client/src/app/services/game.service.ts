import { Injectable } from '@angular/core';
import { Game } from 'phaser';
import { MainScene } from '../scenes/main.scene';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  BaseMessage,
  MSG_TYPE_PLAYER_READY,
  PlayerReadyMessage,
  MSG_TYPE_PLAYER_END_TURN,
  PlayerEndTurnMessage,
  MSG_TYPE_COLLECT_STATS,
  CollectStatsMessage
} from '../gameinfo/messages';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
//import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

@Injectable()
export class GameService {

  created = false;
  game: Game;
  socket: WebSocket;
  event = new Subject<BaseMessage>();
  player: string;
  isPlayerTurn: boolean;

  constructor(private http: HttpClient, private router: Router) {}

  createGame() {
    if(this.created)
      return;

    this.game = new Game({
      width: ((32*10)+(40*2)),
      height: ((32*20)+(10)+(30*2)),
      parent: 'game',
      // plugins:{
      //   scene:[{
      //     key: 'rexUI',
      //     plugin: UIPlugin,
      //     mapping: 'rexUI'
      //   }]
      // },
      type: Phaser.AUTO,
      scene: [MainScene]
    })
  }

  registerPlayer() {
    this.socket = new WebSocket(`ws://localhost:3000/play/${this.player}`)
    // this.socket.onopen = ()=>{
    //   console.info('client websocket is open');
    // }
    this.socket.onmessage = (payload: MessageEvent)=> {
      const msg = JSON.parse(payload.data) as BaseMessage;
      console.info('Received msg: ', msg);
      this.event.next(msg);
    }
    this.socket.onclose = ()=>{
      //handle close, pass back info to component
    }
  }

  playerIsReady(ship1X: number, ship1Y:number) {
    console.info('player is ready called');
    const msg: PlayerReadyMessage = {
      type: MSG_TYPE_PLAYER_READY,
      player: this.player,
      ship1X: ship1X,
      ship1Y: ship1Y
    }
    this.socket.send(JSON.stringify(msg));
  }

  endPlayerTurn(bombLoc:[]){
    console.info('player turn end');
    console.info(bombLoc);
    const msg: PlayerEndTurnMessage = {
      type: MSG_TYPE_PLAYER_END_TURN,
      player: this.player,
      bombLoc: bombLoc
    }
    this.socket.send(JSON.stringify(msg));
  }

  collectMatchStats(hits, misses, shots) {
    console.info("player stats - " + hits +"/"+ misses + "/" + shots);
    const msg: CollectStatsMessage = {
      type: MSG_TYPE_COLLECT_STATS,
      player: this.player,
      stats: {hits: hits, misses: misses, shots: shots}
    }
    this.socket.send(JSON.stringify(msg));
  }

  playAgain() {
    console.info("play again");
    this.router.navigate([], {
      skipLocationChange: true,
      queryParamsHandling: 'merge'
    })
  }

  goToRankings() {
    this.router.navigate(['/rankings']);
  }

  getRankings(){
    const result = this.http.get<any>(environment.backendURL+'/rankings');
    return result;
  }

}
