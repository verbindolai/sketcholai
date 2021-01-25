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
    private player: Player;

    constructor(id: string, name: string, lobbyID: string) {
        this._socketID = id;
        this._name = name;
        this._isInRoom = false;
        this._lobbyID = lobbyID;
        this.player = new Player();
    }


    get socketID(): string {
        return this._socketID;
    }

    get name(): string {
        return this._name;
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
