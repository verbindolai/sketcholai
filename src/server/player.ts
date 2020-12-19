export class Player {

    private static maxId : number;

    private readonly _id : number;
    private _name: string;
    private _isDrawing : boolean;
    private _points : number;
    private _isInRoom : boolean;

    constructor(name: string) {
        this._id = Player.maxId;
        this._name = name;
        this._isDrawing = false;
        this._points = 0;
        this._isInRoom = false;
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
}
