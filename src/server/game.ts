import {LinkedList} from "typescriptcollectionsframework";
import {Connection, ReadyStatus} from "./connection";
import {Server as SocketServer} from "socket.io";
import {ChatType, CommHandler, MessageType} from "./handlers/commHandler";
import {RoomHandler} from "./handlers/roomHandler";
import {GameLobby} from "./gameLobby";
const signale = require('signale');


export class Game {


    public readonly WORD_PAUSE_DURATION_SEC : number = 15;
    public readonly ROUND_PAUSE_DURATION_SEC : number = 7;
    public readonly WORD_SUGGESTION_NUM : number = 3;
    public readonly START_POINT_MULTIPLICATOR : number = 4;
    public readonly GUESS_RIGHT_POINTS : number = 100;
    public readonly DRAW_POINTS : number = 120;
    public readonly HINT_TIME : number = 10;

    private _lobbyLeaderID : string;
    private readonly _GAME_ID : string;

    private _winner: Connection | undefined = undefined;
    private _roundPlayerArr : Connection[] = [];
    private readonly _connections: LinkedList<Connection>;
    private readonly _words: string[] = [];
    private _wordSuggestions: string[] = [];

    private readonly _lobbyId: string;
    private _hasStarted : boolean;

    private _roundCount : number;
    private readonly _roundDurationSec: number;

    private readonly _maxRoundCount : number;

    private _currentPlaceholder : string = "";
    private _currentWord : string = "";

    private _currentPlayer : Connection | undefined;
    private _currentGameState : GameState;
    private _pointMultiplicator : number;

    private _turnStartDate: number = 0;
    private _wordPauseStartDate: number = 0;
    private _roundPauseStartDate: number = 0;
    private _hintDate : number = 0;

    private _turnEnded : boolean;
    private _wordPauseEnded : boolean;
    private _roundPauseEnded : boolean;

    private _stop : boolean = false;

    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, connections: LinkedList<Connection>, words : string[], leaderID : string) {
        this._GAME_ID = GameLobby.randomString();
        this._connections = connections;
        this._roundDurationSec = roundDuration;
        this._lobbyId = lobbyId;
        this._roundCount = 0;
        this._maxRoundCount = maxRoundCount;
        this._hasStarted = false;
        this._words = words;
        this._currentGameState = GameState.NOT_STARTED;
        this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
        this._turnEnded = false;
        this._wordPauseEnded = false;
        this._roundPauseEnded = false;
        this._lobbyLeaderID = leaderID;
        signale.success(`New game created for ${lobbyId} with ${maxRoundCount} rounds and ${roundDuration} seconds draw time. Game-ID: ${this._GAME_ID}`)
    }

    //Called on game initialization
    public init(io : SocketServer) {
        signale.start(`Starting game with ${this.maxRoundCount} rounds.`)
        this.startGameLoop(io)
        this._hasStarted = true;
    }

    private giveHint(io : SocketServer) {
        let randomIndex = Math.floor(Math.random() * this._currentWord.length);
        if ((this._currentPlaceholder.match(/_/g) || []).length > 3){
            this._currentPlaceholder = this.replaceAt(this._currentPlaceholder, randomIndex, this._currentWord.charAt(randomIndex));
            if (this._currentPlayer != undefined){
                signale.info("Giving hint.")
                this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentPlaceholder))
            }
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
                    if (((Date.now() - this._turnStartDate) / 1000 > this._roundDurationSec)){
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
                        if (this._roundCount >= this._maxRoundCount){
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

        for(let player of this._connections){
            this._roundPlayerArr.push(player);
        }
        this.startWordPause(io);
    }

    private endRound(io : SocketServer, interval : any) {
        this._roundCount++;
        signale.complete("Round ended.")
        //End of the Game
        //Start round pause
        signale.start("Starting round pause.")
        this._currentGameState = GameState.ROUND_PAUSE;
        this._roundPauseStartDate = Date.now();
        io.in(this._lobbyId).emit("updateGameState",CommHandler.packData(this._roundPauseStartDate, this.ROUND_PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentPlaceholder, undefined, RoomHandler.listToArr(this._connections)) )
    }

    private startWordPause(io : SocketServer) {
        signale.start("Starting choose word Pause.")
        this._wordPauseEnded = false;
        this._turnEnded = false;

        this._currentPlayer = this._roundPlayerArr[0];
        if (this._currentPlayer == undefined) { //TODO Right?
            signale.warn("No current Player!")
            return;
        }
        this._currentGameState = GameState.WORD_PAUSE;
        this._wordPauseStartDate = Date.now();

        //Drawing player is not allowed to write in the "normal" chat
        this._currentPlayer.player.guessedCorrectly = true;

        //Get word suggestions
        this._wordSuggestions = this.randomWordArr(this.WORD_SUGGESTION_NUM);

        //Send word suggestions, current player and pause duration to clients
        this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommHandler.packData(this._wordPauseStartDate, this.WORD_PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentWord))
        io.to(this._currentPlayer.socketID).emit('updateGameState', CommHandler.packData(this._wordPauseStartDate, this.WORD_PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, this._wordSuggestions, this._currentWord))

        //SERVER-CHAT_MESSAGE
        //io.in(this._lobbyId).emit("chat",CommHandler.packData(CommHandler.DRAW_MESSAGE, this._currentPlayer.name, CommHandler.SERVER_MSG_COLOR, true) )

    }

    private startTurn(io: SocketServer) {
        signale.start("Starting new Turn.")

        if (this._currentWord === ""){
            signale.info("No word choosen! Word gets picked random.")
            let randomIndex =  Math.floor(Math.random() * this.WORD_SUGGESTION_NUM);
            this._currentWord = this._wordSuggestions[randomIndex];
            this._currentPlaceholder = this._currentWord.replace(/[^- ]/g, "_")
        }

        if (this._currentPlayer == undefined){
            signale.warn("No current Player!")
            return;
        }

        this._hintDate = Date.now();
        this._currentPlayer.player.isDrawing = true;
        this._turnStartDate = Date.now();
        this._currentGameState = GameState.RUNNING;

        this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentPlaceholder))
        io.to(this._currentPlayer.socketID).emit('updateGameState', CommHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentWord));
    }

    private endTurn(io : SocketServer, interval : any) {
        if (this._currentPlayer != undefined){

            signale.complete("Turn ended.")
            //send server msg what the current word was
            io.in(this._lobbyId).emit("chat",CommHandler.packData("The word was " + this._currentWord, undefined, CommHandler.SERVER_MSG_COLOR, MessageType.SERVER_MESSAGE, ChatType.NORMAL_CHAT) )


            this._currentWord = "";
            this._currentPlaceholder = "";
            this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
            this._currentPlayer.player.isDrawing = false;
            this._roundPlayerArr.splice(0,1)


            for (let conn of this._connections){
                conn.player.guessedCorrectly = false;
            }
        }
        //End of one Round
        if(this._roundPlayerArr.length == 0){
            this.endRound(io, interval)
        } else {
            this.startWordPause(io);
        }
    }

    private endGame(io : SocketServer, interval : any){
        signale.complete("Ending Game.")
        this._currentGameState = GameState.ENDED;
        if (interval != null){
            clearInterval(interval);
        }
        let winner;
        let points = 0;
        for (let conn of this._connections){
            if (conn.player.points >= points){
                points = conn.player.points;
                winner = conn;
            }
        }
        this.resetGame()
        io.in(this._lobbyId).emit("updateGameState",CommHandler.packData(0, 0, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentPlaceholder, winner, RoomHandler.listToArr(this._connections), this.lobbyLeaderID))
        this._currentGameState = GameState.NOT_STARTED;
    }

    private resetGame() {
        signale.info("Resetting game.")
        this._roundCount = 0;
        if (this.currentPlayer != undefined) {
            this.currentPlayer.player.isDrawing = false;
        }
        this._currentPlayer = undefined;
        this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
        this._hasStarted = false;
        this._turnStartDate = 0;
        this._wordPauseStartDate = 0;
        this._turnEnded = false;
        this._wordPauseEnded = false;
        this._roundCount = 0;

        for (let conn of this._connections){
            conn.player.reset();
            conn.readyStatus = ReadyStatus.NOT_READY;
        }
    }

    private randomWordArr(num : number) : string[] {
        let words = [];
        for (let i = 0; i < num; i++){
            let randomIndex = Math.floor(Math.random() * this._words.length);
            words.push(this._words[randomIndex]);
        }
        return words;
    }

    public sendToAllExcl(io :SocketServer, socketID :string , ev : string, data : any) {
        for(let connection of this.connections){
            if (connection.socketID !== socketID){
                io.to(connection.socketID).emit(ev, data);
            }
        }
    }

    public decrementPointMult(){
        if (this._pointMultiplicator - 1 >= 1){
            this._pointMultiplicator--;
        }
    }

    public replaceAt(string : string, index : number, replace : string) {
        return string.substring(0, index) + replace + string.substring(index + 1);
    }

    get turnEnded(): boolean {
        return this._turnEnded;
    }

    set turnEnded(value: boolean) {
        this._turnEnded = value;
    }

    get hasStarted(): boolean {
        return this._hasStarted;
    }

    get currentPlayer(): Connection | undefined {
        return this._currentPlayer;
    }


    get winner(): Connection | undefined {
        return this._winner;
    }

    get currentPlaceholder(): string {
        return this._currentPlaceholder;
    }

    set currentPlaceholder(value: string) {
        this._currentPlaceholder = value;
    }

    get roundPlayerArr(): Connection[] {
        return this._roundPlayerArr;
    }

    get connections(): LinkedList<Connection> {
        return this._connections;
    }

    get lobbyId(): string {
        return this._lobbyId;
    }

    get roundCount(): number {
        return this._roundCount;
    }

    get roundDurationSec(): number {
        return this._roundDurationSec;
    }

    get turnStartDate(): number {
        return this._turnStartDate;
    }

    get stop(): boolean {
        return this._stop;
    }

    set stop(value: boolean) {
        this._stop = value;
    }

    set winner(value: Connection | undefined) {
        this._winner = value;
    }

    set hasStarted(value: boolean) {
        this._hasStarted = value;
    }

    set turnStartDate(value: number) {
        this._turnStartDate = value;
    }

    set currentPlayer(value: Connection | undefined) {
        this._currentPlayer = value;
    }


    set lobbyLeaderID(value: string) {
        this._lobbyLeaderID = value;
    }

    get maxRoundCount(): number {
        return this._maxRoundCount;
    }


    set currentWord(value: string) {
        this._currentWord = value;
    }

    get words(): string[] {
        return this._words;
    }

    get currentWord(): string {
        return this._currentWord;
    }

    get currentGameState(): GameState {
        return this._currentGameState;
    }

    set currentGameState(value: GameState) {
        this._currentGameState = value;
    }

    get pointMultiplicator(): number {
        return this._pointMultiplicator;
    }

    set pointMultiplicator(value: number) {
        this._pointMultiplicator = value;
    }

    get wordPauseEnded(): boolean {
        return this._wordPauseEnded;
    }

    set wordPauseEnded(value: boolean) {
        this._wordPauseEnded = value;
    }

    get wordSuggestions(): string[] {
        return this._wordSuggestions;
    }

    get wordPauseStartDate(): number {
        return this._wordPauseStartDate;
    }

    get lobbyLeaderID(): string {
        return this._lobbyLeaderID;
    }

    set roundPlayerArr(value: Connection[]) {
        this._roundPlayerArr = value;
    }

    set wordSuggestions(value: string[]) {
        this._wordSuggestions = value;
    }

    set roundCount(value: number) {
        this._roundCount = value;
    }

    set wordPauseStartDate(value: number) {
        this._wordPauseStartDate = value;
    }

}

export enum GameState{
    RUNNING,
    WORD_PAUSE,
    ENDED,
    NOT_STARTED,
    ROUND_PAUSE,
}


