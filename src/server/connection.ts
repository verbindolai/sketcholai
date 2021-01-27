/**
 * Represents a Player.
 * @author Christopher Peters, Nikolai Wieczorek+
 * @version 1.0
 */
import {Player} from "./player";

export class Connection {

    private readonly _socketID: string;
    private _name: string;
    private _isInRoom: boolean;
    private _lobbyID: string;
    private _player: Player;
    private _receivedCanvas : boolean;

    constructor(id: string, name: string, lobbyID: string) {
        this._socketID = id;
        this._name = name;
        this._isInRoom = false;
        this._lobbyID = lobbyID;
        this._player = new Player();
        this._receivedCanvas = false;
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

    get isInRoom(): boolean {
        return this._isInRoom;
    }

    set isInRoom(value: boolean) {
        this._isInRoom = value;
    }


    get lobbyID(): string {
        return this._lobbyID;
    }

    set lobbyID(value: string) {
        this._lobbyID = value;
    }

    public toString(): string {
        return "name: " + this._name + "\n" +
            "id: " + this._socketID + "\n" +
            "isInRoom: " + this._isInRoom + "\n" +
            "lobbyID: " + this._lobbyID + "\n";

    }
}
