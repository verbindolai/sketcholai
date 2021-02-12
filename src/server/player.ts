
export class Player {

    private _isDrawing: boolean;
    private _points: number;
    private _guessedCorrectly : boolean;
    private _guessStreak : number;

    constructor() {
        this._isDrawing = false;
        this._points = 0;
        this._guessedCorrectly = false;
        this._guessStreak = 0;
    }

    public reset() {
        this._isDrawing = false;
        this._points = 0;
        this._guessedCorrectly = false;
    }

    public rightGuess(points : number){
        this._points += points;
        this.guessedCorrectly = true;
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
    set points(value: number) {
        this._points = value;
    }

    get guessedCorrectly(): boolean {
        return this._guessedCorrectly;
    }

    set guessedCorrectly(value: boolean) {
        this._guessedCorrectly = value;
    }

    get guessStreak(): number {
        return this._guessStreak;
    }

    set guessStreak(value: number) {
        this._guessStreak = value;
    }
}
