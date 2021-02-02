/**
 * Represents a Player.
 * @author Christopher Peters, Nikolai Wieczorek+
 * @version 1.0
 */
import {Player} from "./player";

export class Connection {

    private readonly _socketID: string;
    private _name: string;
    private _lobbyID: string;
    private _player: Player;
    private _receivedCanvas : boolean;
    private _chatColor : string;
    private _readyStatus : number;

    //TODO Make Role Enum and Role Arr
    private _isHost : boolean;
    private _isWizzard : boolean;


    constructor(id: string, name: string, lobbyID: string) {
        this._socketID = id;
        this._name = name;
        this._lobbyID = lobbyID;
        this._player = new Player();
        this._receivedCanvas = false;
        this._chatColor = this.randomColor();
        this._isHost = false;
        this._isWizzard = false;
        this._readyStatus = ReadyStatus.NOT_READY;
    }


    get receivedCanvas(): boolean {
        return this._receivedCanvas;
    }

    set receivedCanvas(value: boolean) {
        this._receivedCanvas = value;
    }

    get socketID(): string {
        return this._socketID;
    }

    get name(): string {
        return this._name;
    }


    get player(): Player {
        return this._player;
    }


    set player(value: Player) {
        this._player = value;
    }


    get lobbyID(): string {
        return this._lobbyID;
    }

    set lobbyID(value: string) {
        this._lobbyID = value;
    }

    get chatColor(): string {
        return this._chatColor;
    }

    set chatColor(value: string) {
        this._chatColor = value;
    }


    get isHost(): boolean {
        return this._isHost;
    }

    set isHost(value: boolean) {
        this._isHost = value;
    }

    set name(value: string) {
        this._name = value;
    }

    set isWizzard(value: boolean) {
        this._isWizzard = value;
    }


    get isWizzard(): boolean {
        return this._isWizzard;
    }


    get readyStatus(): number {
        return this._readyStatus;
    }

    set readyStatus(value: number) {
        this._readyStatus = value;
    }

    public toString(): string {
        return "name: " + this._name + "\n" +
            "id: " + this._socketID + "\n" +
            "lobbyID: " + this._lobbyID + "\n";
    }

    public randomColor() : string{
        let color = "#" + Math.floor(Math.random()*16777215).toString(16);
        return color;
    }

    //adjusted to descending order of arr.sort
    public static compare (a : Connection, b : Connection) : number {
        if (a.player.points > b.player.points) {
            return -1;
        }
        if (a.player.points < b.player.points){
            return 1;
        }
        return 0;
    }
}
export enum ReadyStatus {
    READY,
    NOT_READY,
}
