import {HashMap, HashSet, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";
import {Server as SocketServer} from "socket.io";
import {CommHandler} from "./handlers/commHandler";

export class Game {


    public readonly PAUSE_DURATION_SEC : number = 15;
    public readonly WORD_SUGGESTION_NUM : number = 3;
    public readonly START_POINT_MULTIPLICATOR : number = 4;
    public readonly GUESS_RIGHT_POINTS : number = 100;
    public readonly DRAW_POINTS : number = 120;

    private _points: HashMap<string, number> = new HashMap<string, number>();
    private _winner: Connection | undefined = undefined;
    private _roundPlayerSet : HashSet<Connection> = new HashSet<Connection>();
    private readonly _connections: LinkedList<Connection>;
    private readonly _words: string[] = [];
    private _wordSuggestions: string[] = [];

    private readonly _lobbyId: string;
    private _hasStarted : boolean;

    private _roundCount : number;
    private readonly _roundDurationSec: number;
    private _turnStartDate: number;
    private readonly _maxRoundCount : number;
    private _currentWord : string = "";

    private _currentPlayer : Connection | undefined;
    private _currentGameState : GameState;
    private _pointMultiplicator : number;
    private _turnEnded : boolean;


    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, players: LinkedList<Connection>, words : string[]) {
        this._connections = players;
        this._roundDurationSec = roundDuration;
        this._turnStartDate = 0;
        this._lobbyId = lobbyId;
        this._roundCount = 0;
        this._maxRoundCount = maxRoundCount;
        this._hasStarted = false;
        this._words = words;
        this._currentGameState = GameState.NOT_STARTED;
        this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
        this._turnEnded = false;
    }

    //Called on game initialization
    public init(io : SocketServer) {
        this.startGameLoop(io)
        this._hasStarted = true;
    }

    private startGameLoop(io : SocketServer){
        this.startRound(io);
        let interval = setInterval(() => {
            switch (this._currentGameState){
                case GameState.RUNNING: {
                    if (((Date.now() - this._turnStartDate) / 1000 > this._roundDurationSec)){
                        this._turnEnded = true;
                    }
                    if (this._turnEnded){
                       this.endTurn(io, interval);
                    }
                    break;
                }
                case GameState.PAUSED: {
                    break;
                }
                case GameState.ENDED: {
                    break;
                }

                case GameState.NOT_STARTED: {
                    break;
                }
            }
        }, 500)
    }

    private startRound(io : SocketServer){
        this._roundPlayerSet = new HashSet<Connection>();
        console.log("All Player in this Round: ")
        for(let player of this._connections){
            this._roundPlayerSet.add(player);
            console.log(player.name)
        }
        this.newTurn(io);
    }

    private endRound(io : SocketServer, interval : any) {
        this._roundCount++;
        //End of the Game
        if (this._roundCount >= this._maxRoundCount){
            this.endGame(io, interval);
        } else { //New Round
            this.startRound(io);
            console.log("Round is over, next Round starting...")
        }
    }

    private newTurn(io : SocketServer) {
        //Choose next Player
        this._turnEnded = false;
        this._currentPlayer = this._roundPlayerSet.iterator().next();
        if (this._currentPlayer == null) { //TODO Right?
            return;
        }
        this._currentGameState = GameState.PAUSED;

        //Drawing player is not allowed to write in the "normal" chat
        this._currentPlayer.player.guessedCorrectly = true;

        //Get word suggestions
        this._wordSuggestions = this.randomWordArr(this.WORD_SUGGESTION_NUM);
        console.log("word Suggs: ")
        console.log(this._wordSuggestions)

        //Send word suggestions, current player and pause duration to clients
        this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommHandler.packData(Date.now(), this.PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentWord))
        io.to(this._currentPlayer.socketID).emit('updateGameState', CommHandler.packData(Date.now(), this.PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, this._wordSuggestions, this._currentWord))

        //SERVER-CHAT_MESSAGE
        io.in(this._lobbyId).emit("chat",CommHandler.packData(CommHandler.DRAW_MESSAGE, this._currentPlayer.name, CommHandler.SERVER_MSG_COLOR, true) )

        //TODO Change pause implementation
        setTimeout(() => {
            //Already started by "chooseWord" in gameHandler
            //TODO what if new Turn is started in commHandler cause all players guessed the word, before this Timer has run out? -> Bug
            if(this._currentGameState == GameState.RUNNING) {
                return;
            }

            //If word not choosen after wait durtation, select randomly
            if (this._currentWord === ""){
                let randomIndex =  Math.floor(Math.random() * this.WORD_SUGGESTION_NUM);
                this._currentWord = this._wordSuggestions[randomIndex];
                console.log("not choosen, random sugg: " + this.currentWord)
            }

            if (this._currentPlayer == undefined){
                return;
            }

            this._currentPlayer.player.isDrawing = true;
            this._turnStartDate = Date.now();
            this._currentGameState = GameState.RUNNING;

            this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], "PLACEHOLDER"))
            io.to(this._currentPlayer.socketID).emit('updateGameState', CommHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], this._currentWord));

            console.log("Next Player choosen: " + this.currentPlayer?.name)
        },(this.PAUSE_DURATION_SEC * 1000))
    }

    private endTurn(io : SocketServer, interval : any) {
        if (this._currentPlayer != undefined){
            if (this._currentPlayer == null) { //TODO Right?
                return;
            }
            this._currentWord = "";
            this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;
            this._currentPlayer.player.isDrawing = false;
            this._roundPlayerSet.remove(this._currentPlayer);

            for (let conn of this._connections){
                conn.player.guessedCorrectly = false;
            }
            console.log("Turn is over...")
        }
        //End of one Round
        if(this._roundPlayerSet.size() == 0){
            this.endRound(io, interval)
        } else {
            this.newTurn(io);
        }
    }

    private endGame(io : SocketServer, interval : any){
        this._currentGameState = GameState.ENDED;
        if (interval != null){
            clearInterval(interval);
        }
        io.in(this._lobbyId).emit("updateGameState",CommHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this._currentGameState, [], "PLACEHOLDER") )

        //TODO send the Gamestate to Clients
        this.resetGame()
        console.log("Ending game...")
        return;
    }





    private resetGame() {
        this._roundCount = 0;
        if (this.currentPlayer != undefined) {
            this.currentPlayer.player.isDrawing = false;
        }
        this._currentPlayer = undefined;
        this._currentGameState = GameState.NOT_STARTED;
        this._pointMultiplicator = this.START_POINT_MULTIPLICATOR;

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
    // getRandomWord(): Promise<string> {
    //     const fetch = require('node-fetch');
    //     let url = "https://random-word-api.herokuapp.com/word?number=1";
    //     let settings = {method: "Get"}
    //     return fetch(url, settings).then((res: any) => res.json()).then((data: any) => {
    //         return data[0];
    //     });
    //     //CODE WILL BE EXECUTED RIGHT AWAY
    // }
    //
    // //Basicly same with more syntactic-sugar.
    // async getRandomWord2(): Promise<string> {
    //     const fetch = require('node-fetch');
    //     let url = "https://random-word-api.herokuapp.com/word?number=1";
    //     let settings = {method: "Get"}
    //     const data = await fetch(url, settings);
    //     const word = await data.json();
    //     //CODE WILL WAIT
    //     return word[0];
    // }
    //
    // trans(text: string) {
    //     let translate = require('node-google-translate-skidz');
    //     translate({
    //         text: text,
    //         source: 'en',
    //         target: 'de'
    //     }, function (result: any) {
    //         console.log(result);
    //     });
    // }


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


    get points(): HashMap<string, number> {
        return this._points;
    }

    get winner(): Connection | undefined {
        return this._winner;
    }

    get roundPlayerSet(): HashSet<Connection> {
        return this._roundPlayerSet;
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


    set points(value: HashMap<string, number>) {
        this._points = value;
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

}

export enum GameState{
    RUNNING,
    PAUSED,
    ENDED,
    NOT_STARTED,
}


