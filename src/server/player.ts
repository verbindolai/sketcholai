export class Player {

    private static maxId : number;

    private readonly _id : number;
    private _name: string;
    private _isDrawing : boolean;
    private _points : number;

    constructor(name: string) {
        this._id = Player.maxId;
        this._name = name;
        this._isDrawing = false;
        this._points = 0;
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

    get points(): number {
        return this._points;
    }
}
