import { Injector } from '@angular/core';

export class User {
  constructor(
    public player_id: string,
    public password: string
  ) {}
}

export interface Ranking {
  playerId: string;
  playerHits: string;
  playerMisses: string;
  playerShots: string;
}

export interface AvatarImage {
	imageAsDataUrl: string
	imageData: Blob
}

export class Globals {
  static injector: Injector
}


