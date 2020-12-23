/**
 * Represents a Player.
 * @author Christopher Peters, Nikolai Wieczorek+
 * @version 1.0
 */

export class Player {

    private readonly _socketID : string;
    private _name: string;
    private _isDrawing : boolean;
    private _points : number;
    private _isInRoom : boolean;
    private _lobbyID : string;

    constructor(id: string, name: string, lobbyID : string) {
        this._socketID = id;
        this._name = name;
        this._isDrawing = false;
        this._points = 0;
        this._isInRoom = false;
        this._lobbyID = lobbyID;
    }


    get socketID(): string {
        return this._socketID;
    }

    get name(): string {
        return this._name;
    }

    get isDrawing(): boolean {
        return this._isDrawing;
    }

    get isInRoom(): boolean {
        return this._isInRoom;
    }

    set isInRoom(value: boolean) {
        this._isInRoom = value;
    }

    get points(): number {
        return this._points;
    }

    get lobbyID(): string {
        return this._lobbyID;
    }

    set lobbyID(value: string) {
        this._lobbyID = value;
    }

    public toString() :string {
        return  "name: " + this._name + "\n" +
                "id: " + this._socketID + "\n" +
                "isDrawing: " + this._isDrawing + "\n" +
                "isInRoom: " + this._isInRoom + "\n" +
                "lobbyID: " + this._lobbyID + "\n";

    }
}
