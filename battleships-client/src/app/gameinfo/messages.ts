export const MSG_TYPE_PLAYER_JOINED = 'player-joined'
export const MSG_TYPE_PLAYER_READY = 'player-ready'
export const MSG_TYPE_ALL_PLAYERS_READY = 'all-players-ready'
export const MSG_TYPE_WAIT_FOR_PLAYERS = 'wait-for-players'
export const MSG_TYPE_PLAYER_WAIT = 'player-wait'
export const MSG_TYPE_PLAYER_TURN = 'player-turn'
export const MSG_TYPE_PLAYER_END_TURN = 'player-end-turn'
export const MSG_TYPE_SELF_SHIP_SINKED = 'self-ship-sinked'
export const MSG_TYPE_ENEMY_SHIP_SINKED = 'enemy-ship-sinked'
export const MSG_TYPE_SHOT_MISSED = 'shot-missed'
export const MSG_TYPE_VICTORY = 'victory-game-over'
export const MSG_TYPE_DEFEAT = 'defeat-game-over'
export const MSG_TYPE_COLLECT_STATS = 'collect-stats'

export interface BaseMessage {
  type: string
}

export interface PlayerJoinedMessage extends BaseMessage {
  player: string
}

export interface PlayerReadyMessage extends BaseMessage {
  player: string,
  ship1X: number,
  ship1Y: number
}

export interface AllPlayersReadyMessage extends BaseMessage {}

export interface WaitForPlayersMessage extends BaseMessage {}

export interface PlayerWaitMessage extends BaseMessage {}

export interface PlayerTurnMessage extends BaseMessage {}

export interface PlayerEndTurnMessage extends BaseMessage {
  player: string,
  bombLoc: []
}

export interface SelfShipSinkedMessage extends BaseMessage {
  sinkLoc: {x: number, y: number }
}

export interface EnemyShipSinkedMessage extends BaseMessage {
  sinkLoc: {x: number, y: number }
}

export interface PlayerShotMissedMessage extends BaseMessage {}

export interface VictoryMessage extends BaseMessage {}

export interface DefeatMessage extends BaseMessage {}

export interface CollectStatsMessage extends BaseMessage {
  player: string,
  stats: {}
}

