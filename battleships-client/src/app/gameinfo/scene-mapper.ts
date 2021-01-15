import { Scene } from "phaser";

export interface SceneMapperConfig {
  scene: Scene,
  columns: number,
  rows: number,
  startPosX: number,
  startPosY: number
}

export class ScreenMapper {

  private gridWidth = 0
  private gridHeight = 0
  private halfGridWidth = 0
  private halfGridHeight = 0
  private scrWidth = 0
  private scrHeight = 0
  private startPosX = 0
  private startPosY = 0

  constructor(private config: SceneMapperConfig) {
    this.scrWidth = 24 * this.config.columns//this.config.scene.game.config.width as number
    this.scrHeight = 24 * this.config.rows//this.config.scene.game.config.height as number
    this.gridWidth = 24;//Math.floor(this.scrWidth / this.config.columns)
    this.gridHeight = 24;//Math.floor(this.scrHeight / this.config.rows)
    this.halfGridWidth = Math.floor(this.gridWidth / 2)
    this.halfGridHeight = Math.floor(this.gridHeight / 2)
    this.startPosX = this.config.startPosX
    this.startPosY = this.config.startPosY
  }

  getTilePos(xA, yA) {
    const x = Math.floor((xA - this.startPosX)/this.gridWidth)
    const y = Math.floor((yA - this.startPosY)/this.gridHeight)
    return {x,y}
  }

  placeObjectAtTile(xA, yA, objA:any) {
    const x = Math.floor((xA - this.startPosX)/this.gridWidth)
    const y = Math.floor((yA - this.startPosY)/this.gridHeight)
    this.placeObjectAt(x, y, objA)
    return {x,y}
  }

  placeObjectAt(x, y, obj: any) {
    obj.x = (x * this.gridWidth) + this.halfGridWidth + this.startPosX
    obj.y = (y * this.gridHeight) + this.halfGridHeight + this.startPosY
  }

  // placeObjectAt(x, y, obj: any) {
  //   obj.x = (x * this.gridWidth) + this.halfGridWidth
  //   obj.y = (y * this.gridHeight) + this.halfGridHeight
  // }

  scaleObject(obj: any, opts: any = {}) {
    if ('scaleX' in opts) {
      obj.scaleX = opts['scaleX']
    }
    if ('scaleY' in opts) {
      obj.scaleY = opts['scaleY']
    }
    if ('scaleToWidth' in opts) {
      obj.displayWidth = Math.floor(this.scrWidth * opts['scaleToWidth'])
      obj.scaleY = obj.scaleX
    }
    if ('scaleToHeight' in opts) {
      obj.displayHeight = Math.floor(this.scrHeight * opts['scaleToHeight'])
      obj.scaleX = obj.scaleY
    }
  }

  placeImageAt(x, y, key: string, opts: any = {}) {
    const img = this.config.scene.add.image(0, 0, key)
    this.scaleObject(img, opts)
    this.placeObjectAt(x, y, img)
    return img
  }

  placeSpriteAt (x, y, key: string, opts: any = {}) {
    const sprite = this.config.scene.add.sprite(0, 0, key)
    this.scaleObject(sprite, opts)
    this.placeObjectAt(x, y, sprite)
    return sprite
  }

  placeTextAt(x, y, msg: string, opts: any = {}) {
    const text = this.config.scene.add.text(0, 0, msg,
      {
        fontFamily: 'Mountains of Christmas',
        fontSize: '6em',
        color: '#00ff00'
      }
    )
    this.placeObjectAt(x, y, text)
    return text
  }

  // helping with object placement
  drawGrids() {

    // get a copy of the graphics context
    const gc = this.config.scene.add.graphics()

    // set the pen characterists
    gc.lineStyle(2, 0xff0000, .5)

    // draw columns
    for (let i = 0; i < (this.config.columns +1); i++) {
      // move the pen to the first location
      gc.moveTo(((i*this.gridWidth) + this.startPosX), this.startPosY)//i * this.gridWidth, 0)
      // draw to the second point
      gc.lineTo(((i*this.gridWidth) + this.startPosX), (this.startPosY + this.scrHeight))//i * this.gridWidth, this.scrHeight)
    }

    // draw rows
    for (let i = 0; i < (this.config.rows +1); i++) {
      gc.moveTo(this.startPosX, ((i*this.gridHeight) + this.startPosY))//0, i * this.gridHeight)
      gc.lineTo((this.startPosX + this.scrWidth), ((i*this.gridHeight) + this.startPosY))//this.scrWidth, i * this.gridHeight)
    }

    gc.strokePath()
  }

}
