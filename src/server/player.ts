export class Player {
    set points(value: number) {
        this._points = value;
    }
    private _isDrawing: boolean;
    private _points: number;
    private _guessedCorrectly : boolean;

    constructor() {
        this._isDrawing = false;
        this._points = 0;
        this._guessedCorrectly = false;
    }

    public reset() {
        this._isDrawing = false;
        this._points = 0;
    }


    set isDrawing(value: boolean) {
        this._isDrawing = value;
    }

    get isDrawing(): boolean {
        return this._isDrawing;
    }

    get points(): number {
        return this._points;
    }


    get guessedCorrectly(): boolean {
        return this._guessedCorrectly;
    }

    set guessedCorrectly(value: boolean) {
        this._guessedCorrectly = value;
    }
}
