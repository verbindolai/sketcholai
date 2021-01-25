export class Player {
    private _isDrawing: boolean;
    private _points: number;

    constructor() {
        this._isDrawing = false;
        this._points = 0;
    }

    public reset() {
        this._isDrawing = false;
        this._points = 0;
    }
}
