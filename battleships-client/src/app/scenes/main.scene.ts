import { Scene, GameObjects, Game } from 'phaser';
import { Subscription } from 'rxjs';
import { GameService } from '../services/game.service';
import { Globals } from '../models/model';
import {
  MSG_TYPE_PLAYER_JOINED,
  PlayerJoinedMessage,
  MSG_TYPE_ALL_PLAYERS_READY,
  MSG_TYPE_PLAYER_WAIT,
  MSG_TYPE_WAIT_FOR_PLAYERS,
  PlayerWaitMessage,
  MSG_TYPE_PLAYER_TURN,
  MSG_TYPE_SELF_SHIP_SINKED,
  SelfShipSinkedMessage,
  MSG_TYPE_ENEMY_SHIP_SINKED,
  EnemyShipSinkedMessage,
  MSG_TYPE_SHOT_MISSED,
  MSG_TYPE_VICTORY,
  MSG_TYPE_DEFEAT
 } from '../gameinfo/messages';
//import { TextArea } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
//import io from 'socket.io-client';
import { ScreenMapper } from '../gameinfo/scene-mapper';

const Random = Phaser.Math.Between;
const PIXEL_FONT = 'pixelFont';
const IMG_BOMB = 'bomb';
const IMG_SHIP = 'ship';
const IMG_EXPLOSION = 'explosion';
const IMG_RECT = 'transparentRect';
const IMG_PLAYER_SHIP1 = 'ship1';
const IMG_PLAYER_SHIP2 = 'ship2';
const IMG_PLAYER_SHIP3 = 'ship3';
const IMG_LAUNCH = 'startGame';

export interface PlayerConfig {
  hitsCount: number;
  missCount: number;
  shotsCount: number;
  playerShips: Ship[];
  hasMove: boolean;
}

export class Player {
  hitsCount = 0;
  missCount = 0;
  shotsCount = 0;
  playerShips = [];
  hasMove = false;
  constructor(private config: PlayerConfig) {

  }
}

export class Ship {
  isHit: boolean;
  isPlaced: boolean;
  tileX: number;
  tileY: number;
  shipSprite: GameObjects.Sprite;
  constructor(
    private hit:boolean, private selected: boolean,
    private x:number, private y:number, private sprite: GameObjects.Sprite) {
    this.isHit = hit;
    this.isPlaced = selected;
    this.tileX = x;
    this.tileY = y;
    this.shipSprite = sprite;
  }
}

export class MainScene extends Scene {

  gameSvc: GameService;
  game$: Subscription;
  enemyMap: ScreenMapper;
  selfMap: ScreenMapper;

  //phaser game components
  hitsLabel; missLabel; shotsLabel;
  hitsCount; missCount; shotsCount;
  //rexBoard; enemyBoard; selfBoard;
  rexUI;
  playerShip1Sprite; playerShip2Sprite; playerShip3Sprite;
  transparentRectSprite;
  playerBombSprite;
  launchButtonSprite;
  playerShip1; playerShip2; playerShip3;
  //socket;
  messageBox;
  endGameBox;
  //this.playerShip1Sprite = new GameObjects.Sprite(this, 0, 0, 'ship1Sprite');

  //player elements
  player;
  playerTries;

  //misc elements
  //bombSprite;
  explosionSprite: GameObjects.Sprite;

  hits = 0; misses = 0; shots = 0;

  constructor() {
    super('main');
    //this.messageBox = new TextArea;
    this.playerTries = 1;
    //this.tempTilePos = {};
    //const explosionSprite = this.add.sprite(0, 0, IMG_EXPLOSION);
    this.gameSvc = Globals.injector.get(GameService)
    this.game$ = this.gameSvc.event.subscribe(
      (msg) => {
        //this.explosionSprite = this.add.sprite(0, 0, IMG_EXPLOSION);
        console.info('>>> ', msg);
        switch (msg.type) {
          case MSG_TYPE_PLAYER_JOINED:
            var { player } = msg as PlayerJoinedMessage;
            console.info("player join msg received:", player);
            //this.messageBox.appendText('New player joined');
            //this.messageBox.scrollToBottom();
            break;

          case MSG_TYPE_ALL_PLAYERS_READY:
            console.info("all players ready");
            this.messageBox.appendText('\nAll players are ready!');
            this.messageBox.scrollToBottom();
            // if(playerTries == 0) {
            //   console.info("next player turn");
            // }
            break;

          case MSG_TYPE_WAIT_FOR_PLAYERS:
            //var { message } = msg as PlayerWaitMessage;
            console.info("wait new players:");//, message);
            this.messageBox.appendText('\nWaiting for players...');
            this.messageBox.scrollToBottom();
            this.transparentRectSprite.disableInteractive();
            break;

          case MSG_TYPE_PLAYER_WAIT:
            console.info("player wait");
            this.messageBox.appendText('\nWaiting for turn...');
            this.messageBox.scrollToBottom();
            this.transparentRectSprite.disableInteractive();
            break;

          case MSG_TYPE_PLAYER_TURN:
            console.info("player turn");
            this.messageBox.appendText('\nAdmiral, make your move...');
            this.messageBox.scrollToBottom();
            this.transparentRectSprite.setInteractive();
            this.playerTries = 1;
            break;

          case MSG_TYPE_SELF_SHIP_SINKED:
            console.info("self ship sinked");
            var { sinkLoc } = msg as SelfShipSinkedMessage;
            this.messageBox.appendText('\nWarning! Ship hit!');
            this.messageBox.scrollToBottom();
            this.explosionSprite = this.add.sprite(0, 0, IMG_EXPLOSION);
            this.selfMap.placeObjectAt(sinkLoc.x, sinkLoc.y, this.explosionSprite);
            break;

          case MSG_TYPE_ENEMY_SHIP_SINKED:
            console.info("enemy ship sinked");
            var { sinkLoc } = msg as EnemyShipSinkedMessage;
            this.explosionSprite = this.add.sprite(0, 0, IMG_EXPLOSION);
            this.enemyMap.placeObjectAt(sinkLoc.x, sinkLoc.y, this.explosionSprite);
            this.hits++;
            this.hitsCount.text = this.hits;
            break;

          case MSG_TYPE_SHOT_MISSED:
            console.info("shot missed");
            this.misses++;
            this.missCount.text = this.misses;
            break;

          case MSG_TYPE_VICTORY:
            console.info("player won!")
            //add pop up text/buttons
            if(this.endGameBox === undefined) {
              this.endGameBox = createDiaglog(this, 'Victory!');
            }
            //call gameSvc victory
            this.gameSvc.collectMatchStats(this.hits, this.misses, this.shots);
            break;

            case MSG_TYPE_DEFEAT:
              console.info("player lost!")
              //add pop up text/buttons
              if(this.endGameBox === undefined) {
                this.endGameBox = createDiaglog(this, 'Defeat!');
              }
              //call gameSvc victory
              this.gameSvc.collectMatchStats(this.hits, this.misses, this.shots);
              break;

          default:
        }
      }
    ),
    (c) => {
      console.info('>>>> completed', c)
    },
    (error) => {
      console.error('>>> error: ', error)
    }
  }

  preload() {

    // this.load.scenePlugin({
    //   key: 'rexboardplugin',
    //   url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexboardplugin.min.js',
    //   sceneKey: 'rexBoard'
    // });

    this.load.scenePlugin({
      key: 'rexuiplugin',
      url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      sceneKey: 'rexUI'
  });

    this.load.spritesheet(IMG_EXPLOSION, "assets/spritesheets/explosion2.png",{
      frameWidth: 24,
      frameHeight: 24
    });

    this.load.spritesheet(IMG_SHIP, "assets/spritesheets/playership.png",{
      frameWidth: 24,
      frameHeight: 24
    });

    this.load.spritesheet(IMG_BOMB, "assets/spritesheets/bomb.png",{
      frameWidth: 24,
      frameHeight: 24
    });

    this.load.spritesheet(IMG_RECT, "assets/spritesheets/transparentRect.png",{
      frameWidth: 240,
      frameHeight: 240
    });

    // this.load.spritesheet(IMG_LAUNCH, "assets/spritesheets/redbutton-small.png",{
    //   frameWidth: 48,
    //   frameHeight: 48
    // });

    this.load.bitmapFont(PIXEL_FONT, "assets/font/font.png"
    , "assets/font/font.xml");
  }

  create() {

    //***- draw boards
    this.enemyMap = new ScreenMapper({
			columns: 10, rows: 10, scene: this, startPosX: 80, startPosY: 80
    })

    this.enemyMap.drawGrids();
    this.transparentRectSprite = this.add.sprite(200, 200, IMG_RECT).setInteractive();

    this.selfMap = new ScreenMapper({
			columns: 10, rows: 10, scene: this, startPosX: 80, startPosY: 350
    })

    this.selfMap.drawGrids();

    //***- handle enemyBoard interactions
    this.transparentRectSprite.on('pointerdown', (pointer)=> {
      var bombLoc = [];
      console.info("enemy board pos: ", pointer.x + " " + pointer.y);
      var tempTilePos = this.enemyMap.getTilePos(pointer.x, pointer.y);
      bombLoc.push(tempTilePos);
      console.info("enemy tile pos: ", tempTilePos);//.x + " " + tempTilePos.y);
      const bombSprite = this.add.sprite(0, 0, IMG_BOMB);
      this.enemyMap.placeObjectAt(tempTilePos.x, tempTilePos.y, bombSprite);
      this.shots++;
      this.shotsCount.text = this.shots;
      this.playerTries--;
      console.info("playerTries: ", this.playerTries);
      if(!(this.playerTries > 0)) {
        console.info("bombLoc: ",bombLoc);
        this.gameSvc.endPlayerTurn(bombLoc as []);
      }
      //this.playerShip1.tileX = tempTilePos.x;
      //this.playerShip1.tileY = tempTilePos.y;
    })

    //***- messageBox
    this.messageBox = this.rexUI.add.textArea({
      x: 200,
      y: 650,
      width: 300,
      height: 100,
      background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 0, 0xdfdfdf ),
      text: this.rexUI.add.BBCodeText({style:{color:'#000000'}}),
    })
    .layout()
    .drawBounds(this.add.graphics(), 0x800000);

    this.messageBox.setText("Welcome Admiral, place your warships in the map below.");

    //***- end game pop up box
    this.endGameBox = undefined;

    //***- labels
    this.hitsLabel = this.add.bitmapText(200,5, PIXEL_FONT, "HITS", 24);
    this.missLabel = this.add.bitmapText(250,5, PIXEL_FONT, "MISSES", 24);
    this.shotsLabel = this.add.bitmapText(320,5, PIXEL_FONT, "SHOTS", 24);
    this.hitsCount = this.add.bitmapText(225,40, PIXEL_FONT, "", 24);
    this.missCount = this.add.bitmapText(295,40, PIXEL_FONT, "", 24);
    this.shotsCount = this.add.bitmapText(358,40, PIXEL_FONT, "", 24);
    this.hitsCount.text = this.hits;
    this.missCount.text = this.misses;
    this.shotsCount.text = this.shots;

    //***- game sprites
    this.playerShip1Sprite = this.add.sprite(38, 362, IMG_SHIP);
    this.playerShip1 = new Ship(false, false, 0, 0, this.playerShip1Sprite);
    this.playerShip1Sprite.setInteractive({draggable:true})
      .on('pointerdown', (pointer, gameObject)=>{
        //this.playerShip1.isSelected = true;
        //console.info(this.playerShip1.isSelected);
      })
      .on('dragstart', (pointer, dragX, dragY)=> {
        this.children.bringToTop(this.playerShip1Sprite);
      })
      .on('drag', (pointer, dragX, dragY)=>{
        //gameObject.x = dragX;
        //gameObject.y = dragY;
        this.playerShip1Sprite.x = dragX;
        this.playerShip1Sprite.y = dragY;
        //console.info(this.playerShip1Sprite.x + " " + this.playerShip1Sprite.y);
      })
      .on('dragend', (pointer, dragX, dragY, dropped)=> {
        //console.info("ship1 drop");
        this.playerShip1.isPlaced = true;
        // this.playerShip1.tileX = pointer.x;
        // this.playerShip1.tileY = pointer.y;
        var tempTilePos = this.selfMap.placeObjectAtTile(pointer.x, pointer.y, this.playerShip1Sprite);
        console.info(tempTilePos);
        this.playerShip1.tileX = tempTilePos.x;
        this.playerShip1.tileY = tempTilePos.y;
        console.info(this.playerShip1);
        this.playerShip1Sprite.disableInteractive();

      });
    //drag


    this.playerShip2Sprite = this.add.sprite(38, 410, IMG_SHIP);
    // this.playerShip2 = new Ship(false, false, 0, 0, this.playerShip2Sprite);
    // this.playerShip2Sprite.setInteractive({draggable:true})
    //   .on('pointerdown', (pointer, gameObject)=>{
    //     //this.playerShip1.isSelected = true;
    //     //console.info(this.playerShip1.isSelected);
    //   })
    //   .on('dragstart', (pointer, dragX, dragY)=> {
    //     this.children.bringToTop(this.playerShip2Sprite);
    //   })
    //   .on('drag', (pointer, dragX, dragY)=>{
    //     //gameObject.x = dragX;
    //     //gameObject.y = dragY;
    //     this.playerShip2Sprite.x = dragX;
    //     this.playerShip2Sprite.y = dragY;
    //     //console.info(this.playerShip1Sprite.x + " " + this.playerShip1Sprite.y);
    //   })
    //   .on('dragend', (pointer, dragX, dragY, dropped)=> {
    //     //console.info("ship1 drop");
    //     this.playerShip2.isPlaced = true;
    //     // this.playerShip1.tileX = pointer.x;
    //     // this.playerShip1.tileY = pointer.y;
    //     var tempTilePos = this.selfMap.placeObjectAtTile(pointer.x, pointer.y, this.playerShip2Sprite);
    //     console.info(tempTilePos);
    //     this.playerShip2.tileX = tempTilePos.x;
    //     this.playerShip2.tileY = tempTilePos.y;
    //     console.info(this.playerShip2);
    //     this.playerShip2Sprite.disableInteractive();
    //   });
    //drag

    this.playerShip3Sprite = this.add.sprite(38, 458, IMG_SHIP);
    // this.playerShip3 = new Ship(false, false, 0, 0, this.playerShip3Sprite);
    // this.playerShip3Sprite.setInteractive({draggable:true})
    //   .on('pointerdown', (pointer, gameObject)=>{
    //     //this.playerShip1.isSelected = true;
    //     //console.info(this.playerShip1.isSelected);
    //   })
    //   .on('dragstart', (pointer, dragX, dragY)=> {
    //     this.children.bringToTop(this.playerShip3Sprite);
    //   })
    //   .on('drag', (pointer, dragX, dragY)=>{
    //     //gameObject.x = dragX;
    //     //gameObject.y = dragY;
    //     this.playerShip3Sprite.x = dragX;
    //     this.playerShip3Sprite.y = dragY;
    //     //console.info(this.playerShip1Sprite.x + " " + this.playerShip1Sprite.y);
    //   })
    //   .on('dragend', (pointer, dragX, dragY, dropped)=> {
    //     //console.info("ship1 drop");
    //     this.playerShip3.isPlaced = true;
    //     // this.playerShip1.tileX = pointer.x;
    //     // this.playerShip1.tileY = pointer.y;
    //     var tempTilePos = this.selfMap.placeObjectAtTile(pointer.x, pointer.y, this.playerShip3Sprite);
    //     console.info(tempTilePos);
    //     this.playerShip3.tileX = tempTilePos.x;
    //     this.playerShip3.tileY = tempTilePos.y;
    //     console.info(this.playerShip3);
    //     this.playerShip3Sprite.disableInteractive();
    //   });
    //drag

    //add launch button
    // this.launchButtonSprite = this.add.sprite(38, 500, IMG_LAUNCH);
    // this.launchButtonSprite.setInteractive()
    //   .on('pointerdown', (pointer, gameObject)=>{
    //     console.info("player is ready");
    //     this.gameSvc.playerIsReady(this.playerShip1.tileX, this.playerShip1.tileY);
    //   })

    //***- handle inputs
    //check player placed ships?
    this.input.keyboard.on('keydown-'+'S', (eventName, event)=>{
      if(this.playerShip1.isPlaced) {
        console.info("x: ", this.playerShip1.tileX);
        this.gameSvc.playerIsReady(this.playerShip1.tileX, this.playerShip1.tileY);
      }
    })

    //check player turn?

  }

  update() {}
}

var createDiaglog = function(scene, title) {
  var dialog = scene.rexUI.add.dialog({
    x: 200,
    y: 355,

    background: scene.rexUI.add.roundRectangle(0, 0, 30, 50, 5, 0x888888),

    title: scene.rexUI.add.label({
        //background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
        text: scene.add.text(10, 0, title, {
            fontSize: '24px'
        }),
        space: {
            left: 130,
            right: 100,
            top: 10,
            bottom: 10
        }
    }),

    // content: this.add.text(0, 0, 'Do you want to build a snow man?', {
    //     fontSize: '24px'
    // }),

    actions: [], // Assing an empty array instead of `undefined`

    space: {
        title: 25,
        content: 25,
        action: 15,

        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
    },

    align: {
        actions: 'center', // 'center'|'left'|'right'
    },

    expand: {
        content: false, // Content is a pure text object
    }
})
    .addAction([
        createLabel(scene, 'Play Again?'),
        createLabel(scene, 'Go to Rankings?')
    ])
    .layout()
    // .drawBounds(this.add.graphics(), 0xff0000)
    .popUp(1000);

//scene.print = scene.add.text(0, 0, '');
dialog
    .on('button.click', function (button, groupName, index) {
        //this.print.text += index + ': ' + button.text + '\n';
        if(index == 0) {
          this.gameSvc.playAgain();
        }
        else if (index == 1) {
          this.gameSvc.goToRankings();
        }
    }, scene)
    .on('button.over', function (button, groupName, index) {
        button.getElement('background').setStrokeStyle(1, 0xffffff);
    })
    .on('button.out', function (button, groupName, index) {
        button.getElement('background').setStrokeStyle();
    });

  return dialog;
}

var createLabel = function (scene, text) {
  return scene.rexUI.add.label({
      // width: 40,
      // height: 40,

      background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x474747),

      text: scene.add.text(0, 0, text, {
          fontSize: '18px'
      }),

      space: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
      }
  });
}

