export class Player {


    private static maxId : number = 0;

    private readonly _id : number;
    private _name: string;
    private _isDrawing : boolean;
    private _points : number;
    private _isInRoom : boolean;
    private _lobbyID : number;

    constructor(name: string, roomID : number) {
        this._id = Player.maxId;
        this._name = name;
        this._isDrawing = false;
        this._points = 0;
        this._isInRoom = false;
        this._lobbyID = roomID;
        Player.maxId++;
    }


    get id(): number {
        return this._id;
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

    get lobbyID(): number {
        return this._lobbyID;
    }

    set lobbyID(value: number) {
        this._lobbyID = value;
    }

    public toString() :string {
        return  "name: " + this._name + "\n" +
                "id: " + this._id + "\n" +
                "isDrawing: " + this._isDrawing + "\n" +
                "isInRoom: " + this._isInRoom + "\n" +
                "lobbyID: " + this._lobbyID + "\n";

    }
}
