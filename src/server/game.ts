import {LinkedList} from "typescriptcollectionsframework";
import {Connection, ReadyStatus} from "./connection";
import {Server as SocketServer} from "socket.io";
import {ChatType, CommHandler, MessageType} from "./handlers/commHandler";
import {RoomHandler} from "./handlers/roomHandler";
import {GameLobby} from "./gameLobby";
import {signale} from "./server";
import {GameModeInterface} from "./gameModeInterface";
import {DefaultGame} from "./defaultGame";


export class Game {

    private _lobbyLeaderID : string;
    private readonly _GAME_ID : string;
    private readonly _lobbyId: string;

    public readonly WORD_PAUSE_DURATION_SEC : number = 15;
    public readonly ROUND_PAUSE_DURATION_SEC : number = 7;
    public readonly WORD_SUGGESTION_NUM : number = 3;
    public readonly START_POINT_MULTIPLICATOR : number = 4;
    public readonly GUESS_RIGHT_POINTS : number = 100;
    public readonly DRAW_POINTS : number = 120;
    public readonly HINT_TIME : number = 10;

    private readonly _ROUND_DURATION_SEC: number;
    private readonly _MAX_ROUND_COUNT : number;

    private readonly _words: string[] = [];
    private _wordSuggestions: string[] = [];
    private _currentPlaceholder : string = "";
    private _currentWord : string = "";
    private readonly _customWords : string[];
    private readonly _customOnly : boolean;

    private readonly _connections: LinkedList<Connection>;
    private _winner: Connection | undefined = undefined;

    private _currentGameState : GameState;
    private _roundCount : number;
    private _hasStarted : boolean;
    private _stop : boolean = false;
    private _wordGuessed : boolean = false;

    private _pointMultiplicator : number;

    private _turnStartDate: number = 0;
    private _wordPauseStartDate: number = 0;
    private _roundPauseStartDate: number = 0;
    private _hintDate : number = 0;

    private _turnEnded : boolean;
    private _wordPauseEnded : boolean;
    private _roundPauseEnded : boolean;

    private _gameMode : GameModeInterface = new DefaultGame();



    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, connections: LinkedList<Connection>, words : string[], leaderID : string, customWords : string[], customOnly : boolean) {
        this._GAME_ID = GameLobby.randomString();
        this._ROUND_DURATION_SEC = roundDuration;
        this._lobbyId = lobbyId;
        this._roundCount = 0;
        this._MAX_ROUND_COUNT = maxRoundCount;
        this._hasStarted = false;
        this._words = words;
        this._currentGameState = GameState.NOT_STARTED;
        this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
        this._turnEnded = false;
        this._wordPauseEnded = false;
        this._roundPauseEnded = false;
        this._lobbyLeaderID = leaderID;
        this._customWords = customWords;
        this._customOnly = customOnly;
        this._connections = connections;
        this._gameMode.init(connections);
        signale.success(`New game created for ${lobbyId} with ${maxRoundCount} rounds and ${roundDuration} seconds draw time. Game-ID: ${this._GAME_ID}`)
    }

    //Called on game initialization
    public init(io : SocketServer) {
        signale.start(`Starting game with ${this.MAX_ROUND_COUNT} rounds.`)
        this.startGameLoop(io)
        this._hasStarted = true;
    }

    /**
     * Invoked if a player made a right guess
     * @return The points the player gets for the right guess
     */
    public playerGuessedRight() : number {
        this._gameMode.addPointsToDrawingPlayers(this.DRAW_POINTS);
        this.decrementPointMult();         //First guesses give more points
        return this.GUESS_RIGHT_POINTS * this.pointMultiplicator
    }

    private giveHint(io : SocketServer) {
        let randomIndex = Math.floor(Math.random() * this._currentWord.length);
        if ((this._currentPlaceholder.match(/_/g) || []).length > 3){
            this._currentPlaceholder = this.replaceAt(this._currentPlaceholder, randomIndex, this._currentWord.charAt(randomIndex));
            signale.info("Giving hint.")
            const drawingSocketIDs : string[] = this._gameMode.getCurrentPlayerNames();
            this.sendToAllExcl(io, this._gameMode.getCurrentPlayerSocketIDs(), "updateGameState", CommHandler.packData(this._turnStartDate, this._ROUND_DURATION_SEC, this._gameMode.getCurrentPlayerNames, drawingSocketIDs, this._currentGameState, [], this._currentPlaceholder))
        }
    }

    private startGameLoop(io : SocketServer){
        this.startRound(io);
        let interval = setInterval(() => {
            if(this._stop){
                signale.info(`Stopping game with ID: ${this._GAME_ID}`)
                clearInterval(interval);
                this.resetGame();
            }

            switch (this._currentGameState){
                case GameState.RUNNING: {
                    if (((Date.now() - this._turnStartDate) / 1000 > this._ROUND_DURATION_SEC)){
                        this._turnEnded = true;
                    }
                    if (this._turnEnded){
                       this.endTurn(io, interval);
                    }
                    if(((Date.now() - this._hintDate) / 1000 > this.HINT_TIME)){
                        this._hintDate = Date.now();
                        this.giveHint(io);
                    }

                    break;
                }
                case GameState.WORD_PAUSE: {
                    if (((Date.now() - this._wordPauseStartDate) / 1000 > this.WORD_PAUSE_DURATION_SEC)){
                        this._wordPauseEnded = true;
                    }

                    if(this._wordPauseEnded) {
                        signale.complete("Word choosing pause ended.")
                        this.startTurn(io)
                    }
                    break;
                }
                case GameState.ROUND_PAUSE: {
                    if (((Date.now() - this._roundPauseStartDate) / 1000 > this.ROUND_PAUSE_DURATION_SEC)){
                        this._roundPauseEnded = true;
                    }
                    if (this._roundPauseEnded){
                        //New Round
                        signale.complete("Round pause ended.")
                        if (this._roundCount >= this._MAX_ROUND_COUNT){
                            this.endGame(io, interval);
                        } else {
                            this.startRound(io);
                        }
                    }
                    break;
                }

                case GameState.ENDED: {
                    break;
                }

                case GameState.NOT_STARTED: {
                    break;
                }
            }
        }, 250)
    }


    private startRound(io : SocketServer){
        signale.start("Starting round")
        this._roundPauseEnded = false;
        this._gameMode.prepareNextRound();
        this.startWordPause(io);
    }

    private endRound(io : SocketServer, interval : any) {
        this._roundCount++;
        signale.complete("Round ended.")
        signale.start("Starting round pause.")
        this._currentGameState = GameState.ROUND_PAUSE;
        this._roundPauseStartDate = Date.now();
        io.in(this._lobbyId).emit("updateGameState",CommHandler.packData(this._roundPauseStartDate, this.ROUND_PAUSE_DURATION_SEC, this._gameMode.getCurrentPlayerNames, this._gameMode.getCurrentPlayerSocketIDs, this._currentGameState, [], this._currentPlaceholder, undefined, this._connections));
    }

    private startWordPause(io : SocketServer) {
        signale.start("Starting choose word Pause.")
        this._wordPauseEnded = false;
        this._turnEnded = false;

        // this._currentPlayer = this._roundPlayerArr[0];
        this._gameMode.prepareNextTurn();
        if (!this._gameMode.hasCurrentPlayers()) { //TODO Right?
            signale.warn("No current Player!")
            return;
        }
        this._currentGameState = GameState.WORD_PAUSE;
        this._wordPauseStartDate = Date.now();

        //Drawing player is not allowed to write in the "normal" chat
        // this._currentPlayer.player.guessedCorrectly = true;

        //Get word suggestions
        this._wordSuggestions = this.randomWordArr(this.WORD_SUGGESTION_NUM);

        //Send word suggestions, current player and pause duration to clients
        const drawingSocketIDs : string[] = this._gameMode.getCurrentPlayerSocketIDs();
        const drawingNames : string[] = this._gameMode.getCurrentPlayerNames();
        this.sendToAllExcl(io, drawingSocketIDs, "updateGameState", CommHandler.packData(this._wordPauseStartDate, this.WORD_PAUSE_DURATION_SEC, drawingNames, drawingSocketIDs, this._currentGameState, [], this._currentWord));
        for(let id of drawingSocketIDs){
            io.to(id).emit('updateGameState', CommHandler.packData(this._wordPauseStartDate, this.WORD_PAUSE_DURATION_SEC, drawingNames, drawingSocketIDs, this._currentGameState, this._wordSuggestions, this._currentWord));
        }
        //SERVER-CHAT_MESSAGE
        io.in(this._lobbyId).emit("chat",CommHandler.packData(CommHandler.DRAW_MESSAGE, this.getCurrentPlayerNames(), CommHandler.SERVER_MSG_COLOR, true) )
    }

    private startTurn(io: SocketServer) {
        signale.start("Starting new Turn.")

        if (this._currentWord === ""){
            signale.info("No word choosen! Word gets picked random.")
            let randomIndex =  Math.floor(Math.random() * this.WORD_SUGGESTION_NUM);
            this._currentWord = this._wordSuggestions[randomIndex];
            this._currentPlaceholder = this._currentWord.replace(/[^- ]/g, "_")
        }

        // if (this._currentPlayer == undefined){   //TODO hätte hier nicht _currentPlayer gesetzt werden müssen?
        //     signale.warn("No current Player!")
        //     return;
        // }
        // this._currentPlayer.player.isDrawing = true;
        this._gameMode.prepareNextTurn();


        this._hintDate = Date.now();
        this._turnStartDate = Date.now();
        this._currentGameState = GameState.RUNNING;

        const drawingSocketIDs : string[] = this._gameMode.getCurrentPlayerSocketIDs();
        const drawingNames : string[] = this._gameMode.getCurrentPlayerNames();

        this.sendToAllExcl(io, this._gameMode.getCurrentPlayerSocketIDs(), "updateGameState", CommHandler.packData(this._turnStartDate, this._ROUND_DURATION_SEC, drawingNames, drawingSocketIDs, this._currentGameState, [], this._currentPlaceholder));
        for(let id of drawingSocketIDs){
            io.to(id).emit('updateGameState', CommHandler.packData(this._turnStartDate, this._ROUND_DURATION_SEC, drawingNames, drawingSocketIDs, this._currentGameState, [], this._currentWord));
        }
    }

    private endTurn(io : SocketServer, interval : any) {
        if (this._gameMode.hasCurrentPlayers()){

            signale.complete("Turn ended.")
            //send server msg what the current word was
            io.in(this._lobbyId).emit("chat",CommHandler.packData("The word was " + this._currentWord +".", undefined, CommHandler.SERVER_MSG_COLOR, MessageType.SERVER_MESSAGE, ChatType.NORMAL_CHAT) )

            this._currentWord = "";
            this._currentPlaceholder = "";
            this._wordGuessed = false;
            this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;

            // this._currentPlayer.player.isDrawing = false;
            // this._roundPlayerArr.splice(0,1)
            //
            // for (let conn of this._connections){
            //     conn.player.guessedCorrectly = false;
            // }
            if(this._gameMode.endTurn()){
                this.endRound(io, interval)
            } else {
                this.startWordPause(io);
            }
        }else{
            signale.warn("cant end turn - no current players!");
        }
        //End of one Round
        // if(this._gameMode.endTurn()){
        //     this.endRound(io, interval)
        // } else {
        //     this.startWordPause(io);
        // }
    }

    private endGame(io : SocketServer, interval : any){
        signale.complete("Ending Game.")
        this._currentGameState = GameState.ENDED;
        if (interval != null){
            clearInterval(interval);
        }
        // let winner;
        // let points = 0;
        // for (let conn of this._connections){
        //     if (conn.player.points >= points){
        //         points = conn.player.points;
        //         winner = conn;
        //     }
        // }

        this.resetGame()
        io.in(this._lobbyId).emit("updateGameState",CommHandler.packData(0, 0, this._gameMode.getCurrentPlayerNames, this._gameMode.getCurrentPlayerSocketIDs, this._currentGameState, [], this._currentPlaceholder, this._gameMode.getPlayerWithHighscore(), RoomHandler.listToArr(this._connections), this.lobbyLeaderID))
        this._currentGameState = GameState.NOT_STARTED;
    }

    private resetGame() {
        signale.info("Resetting game.")
        this._roundCount = 0;
        // if (this.currentPlayer != undefined) {
        //     this.currentPlayer.player.isDrawing = false;
        // }
        this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
        this._hasStarted = false;
        this._turnStartDate = 0;
        this._wordPauseStartDate = 0;
        this._turnEnded = false;
        this._wordPauseEnded = false;
        this._roundCount = 0;

        this._gameMode.reset();
    }

    private randomWordArr(num : number) : string[] {
        let result = [];
        const allWordsSize = this._words.length + this._customWords.length;

        for (let i = 0; i < num; i++){
            if(this._customOnly){
                let randomIndex = Math.floor(Math.random() * this._customWords.length);
                result.push(this._customWords[randomIndex]);
            }else{
                const diceThrow = Math.floor(Math.random() * 100);
                let arrayToPush : string[];
                if(diceThrow <= (this._words.length / allWordsSize * 100)){
                    arrayToPush = this._words;
                }else{
                    arrayToPush = this._customWords;
                }
                let randomIndex = Math.floor(Math.random() * arrayToPush.length);
                result.push(arrayToPush[randomIndex]);
            }
        }
        return result;
    }

    //TODO so richtig?
    public sendToAllExcl(io : SocketServer, exlcudedConnections : string[] , ev : string, data : any) {
        for(let connection of this._connections){
            if (!exlcudedConnections.includes(connection.socketID)){
                io.to(connection.socketID).emit(ev, data);
            }
        }
    }

    private decrementPointMult(){
        if (this._pointMultiplicator - 1 >= 1){
            this._pointMultiplicator--;
        }
    }

    public replaceAt(string : string, index : number, replace : string) {
        return string.substring(0, index) + replace + string.substring(index + 1);
    }

    public getCurrentPlayerNames(): string[]{
        return this._gameMode.getCurrentPlayerNames()
    }

    public getCurrentPlayerSocketIDs(): string[]{
        return this._gameMode.getCurrentPlayerSocketIDs()
    }

    public addPlayerToRound(conn : Connection) {
        this._gameMode.addPlayerToRound(conn);
    }

    public kickPlayerBySocketId(socketId : string): boolean {
        return this._gameMode.kickPlayerBySocketId(socketId);
    }

    public isSocketIdDrawing(socketID : string) {
        return this._gameMode.isSocketIdDrawing(socketID);
    }

    public decideWord(word : string) {
        this.currentWord = word;
        this.currentPlaceholder =  this.currentWord.replace(/[^- ]/g, "_");
        this.wordPauseEnded = true;
    }


    set turnEnded(value: boolean) {
        this._turnEnded = value;
    }

    get hasStarted(): boolean {
        return this._hasStarted;
    }

    get winner(): Connection | undefined {
        return this._winner;
    }

    get roundPauseStartDate(): number {
        return this._roundPauseStartDate;
    }

    get currentPlaceholder(): string {
        return this._currentPlaceholder;
    }

    set currentPlaceholder(value: string) {
        this._currentPlaceholder = value;
    }

    get lobbyId(): string {
        return this._lobbyId;
    }

    get ROUND_DURATION_SEC(): number {
        return this._ROUND_DURATION_SEC;
    }

    get turnStartDate(): number {
        return this._turnStartDate;
    }

    set stop(value: boolean) {
        this._stop = value;
    }

    set hasStarted(value: boolean) {
        this._hasStarted = value;
    }

    set lobbyLeaderID(value: string) {
        this._lobbyLeaderID = value;
    }

    get MAX_ROUND_COUNT(): number {
        return this._MAX_ROUND_COUNT;
    }

    get wordGuessed(): boolean {
        return this._wordGuessed;
    }

    set wordGuessed(value: boolean) {
        this._wordGuessed = value;
    }

    set currentWord(value: string) {
        this._currentWord = value;
    }

    get currentWord(): string {
        return this._currentWord;
    }

    get currentGameState(): GameState {
        return this._currentGameState;
    }

    get pointMultiplicator(): number {
        return this._pointMultiplicator;
    }

    set wordPauseEnded(value: boolean) {
        this._wordPauseEnded = value;
    }


    get wordPauseStartDate(): number {
        return this._wordPauseStartDate;
    }

    get lobbyLeaderID(): string {
        return this._lobbyLeaderID;
    }

    // get gameMode(): GameModeInterface {
    //     return this._gameMode;
    // }


    get connections(): LinkedList<Connection> {
        return this._connections;
    }
}

export enum GameState{
    RUNNING,
    WORD_PAUSE,
    ENDED,
    NOT_STARTED,
    ROUND_PAUSE,
}


