import {HashMap, HashSet, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";
import {Server as SocketServer} from "socket.io";
import {CommunicationHandler} from "./handlers/communicationHandler";

export class Game {


    private readonly PAUSE_DURATION_SEC : number = 15;
    private readonly WORD_SUGGESTION_NUM : number = 3;

    private _points: HashMap<string, number> = new HashMap<string, number>();
    private _winner: Connection | undefined = undefined;
    private _roundPlayerSet : HashSet<Connection> = new HashSet<Connection>();
    private readonly _connections: LinkedList<Connection>;
    private readonly _words: string[] = [];
    private readonly _lobbyId: string;
    private _hasStarted : boolean;

    private _roundCount : number;
    private readonly _roundDurationSec: number;
    private _turnStartDate: number;
    private readonly _maxRoundCount : number;
    private _currentWord : string = "";

    private _currentPlayer : Connection | undefined;
    private currentGameState : GameState;



    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, players: LinkedList<Connection>, words : string[]) {
        this._connections = players;
        this._roundDurationSec = roundDuration;
        this._turnStartDate = 0;
        this._lobbyId = lobbyId;
        this._roundCount = 0;
        this._maxRoundCount = maxRoundCount;
        this._hasStarted = false;
        this._words = words;
        this.currentGameState = GameState.NOT_STARTED;
    }

    //Called on game initialization
    public init(io : SocketServer) {
        this.startGameLoop(io)
        this._hasStarted = true;
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

    private startGameLoop(io : SocketServer){
        this.startRound(io);

        let interval = setInterval(() => {
            console.log("------- " + this.currentGameState)
            switch (this.currentGameState){
                case GameState.RUNNING: {
                    //End of one Turn
                    if ((Date.now() - this._turnStartDate) / 1000 > this._roundDurationSec){
                        if (this._currentPlayer != undefined){
                            if (this._currentPlayer == null) { //TODO Right?
                                return;
                            }
                            this._currentPlayer.player.isDrawing = false;
                            this._roundPlayerSet.remove(this._currentPlayer);
                            console.log("Turn is over...")
                        }

                        //End of one Round
                        if(this._roundPlayerSet.size() == 0){
                            this._roundCount++;
                            //End of the Game
                            if (this._roundCount >= this._maxRoundCount){
                                if (interval != null){
                                    clearInterval(interval);
                                }
                                //TODO send the Gamestate to Clients
                                this.resetGame()
                                console.log("Ending game...")
                                return;
                            } else { //New Round
                                this.startRound(io);
                                console.log("Round is over, next Round starting...")
                            }
                            //Round not over, next Players turn
                        } else {
                            this.newTurn(io);
                        }
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

    private newTurn(io : SocketServer) {

        //Choose next Player
        this._currentPlayer = this._roundPlayerSet.iterator().next();
        if (this._currentPlayer == null) { //TODO Right?
            return;
        }
        this.currentGameState = GameState.PAUSED;
        //Get word suggestions
        const words : string[] = this.randomWordArr(this.WORD_SUGGESTION_NUM);
        console.log(words);
        //Send word suggestions, current player and pause duration to clients
        this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommunicationHandler.packData(Date.now(), this.PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this.currentGameState, [], this._currentWord))
        io.to(this._currentPlayer.socketID).emit('updateGameState', CommunicationHandler.packData(Date.now(), this.PAUSE_DURATION_SEC, this.currentPlayer?.name, this.currentPlayer?.socketID, this.currentGameState, words, this._currentWord))

        setTimeout(() => {
            //If word not choosen after wait durtation, select randomly
            if (this._currentWord === ""){
                this._currentWord = this.randomWordArr(1)[0];
            }

            if (this._currentPlayer == undefined){
                return;
            }

            this._currentPlayer.player.isDrawing = true;
            this._turnStartDate = Date.now();
            this.currentGameState = GameState.RUNNING;
            this.sendToAllExcl(io, this._currentPlayer.socketID, "updateGameState", CommunicationHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this.currentGameState, [], "PLACEHOLDER"))
            io.to(this._currentPlayer.socketID).emit('updateGameState', CommunicationHandler.packData(this._turnStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID, this.currentGameState, [], this._currentWord));
            console.log("Next Player choosen: " + this.currentPlayer?.name)
        },(this.PAUSE_DURATION_SEC * 1000))



    }


    private resetGame() {
        this._roundCount = 0;
        if (this.currentPlayer != undefined) {
            this.currentPlayer.player.isDrawing = false;
        }
        this._currentPlayer = undefined;
        this.currentGameState = GameState.NOT_STARTED;
    }



    private checkWord(word: string, socketid: string) {

    }

    private randomWordArr(num : number) : string[] {
        let words = [];
        for (let i = 0; i < num; i++){
            let randomIndex = Math.floor(Math.random() * this._words.length);
            words.push(this._words[randomIndex]);
        }
        return words;
    }

    private sendToAllExcl(io :SocketServer, socketID :string , ev : string, data : any) {
        for(let connection of this.connections){
            if (connection.socketID !== socketID){
                io.to(connection.socketID).emit(ev, data);
            }
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

    get maxRoundCount(): number {
        return this._maxRoundCount;
    }


    set currentWord(value: string) {
        this._currentWord = value;
    }
}

enum GameState{
    RUNNING,
    PAUSED,
    ENDED,
    NOT_STARTED,
}


