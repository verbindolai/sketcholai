import {HashMap, HashSet, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";
import {Server as SocketServer} from "socket.io";
import {CommunicationHandler} from "./handlers/communicationHandler";

export class Game {

    private _points: HashMap<string, number> = new HashMap<string, number>();
    private _winner: Connection | undefined = undefined;
    private _roundPlayerSet : HashSet<Connection> = new HashSet<Connection>();
    private readonly _players: LinkedList<Connection>;
    private readonly _lobbyId: string;
    private _hasStarted : boolean;

    private _roundCount : number;
    private readonly _roundDurationSec: number;
    private _roundStartDate: number;
    private readonly _maxRoundCount : number;

    private _currentPlayer : Connection | undefined;




    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, players: LinkedList<Connection>,) {
        this._players = players;
        this._roundDurationSec = roundDuration;
        this._roundStartDate = 0;
        this._lobbyId = lobbyId;
        this._roundCount = 0;
        this._maxRoundCount = maxRoundCount;
        this._hasStarted = false;
    }

    //Called on game initialization
    public init(io : SocketServer) {
        this.startGameLoop(io)
        this._hasStarted = true;
    }

    private startRound(io : SocketServer){
        this._roundPlayerSet = new HashSet<Connection>();
        console.log("All Player in this Round: ")
        for(let player of this._players){
            this._roundPlayerSet.add(player);
            console.log(player.name)
        }
        this._currentPlayer = this._roundPlayerSet.iterator().next();
        if (this._currentPlayer == null) { //TODO Right?
            return;
        }
        this._currentPlayer.player.isDrawing = true;
        this._roundStartDate = Date.now();

        io.to(this._lobbyId).emit('updateGameState', CommunicationHandler.packData(this._roundStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID));
        console.log("started Round: " + this._roundCount)
    }

    private startGameLoop(io : SocketServer){
        this.startRound(io);

        let interval = setInterval(() => {

            //End of one Turn
            if ((Date.now() - this._roundStartDate) / 1000 > this._roundDurationSec){
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
                    }
                    this.startRound(io);
                    console.log("Round is over, next Round starting...")
                } else {
                    this._currentPlayer = this._roundPlayerSet.iterator().next();
                    if (this._currentPlayer == null) { //TODO Right?
                        return;
                    }
                    this._currentPlayer.player.isDrawing = true;
                    this._roundStartDate = Date.now();
                    io.to(this._lobbyId).emit('updateGameState', CommunicationHandler.packData(this._roundStartDate, this._roundDurationSec, this.currentPlayer?.name, this.currentPlayer?.socketID));
                    console.log("Next Player choosen: " + this.currentPlayer?.name)
                }
            }

        }, 500)
    }

    private resetGame() {
        this._roundCount = 0;
        if (this.currentPlayer != undefined) {
            this.currentPlayer.player.isDrawing = false;
        }
        this._currentPlayer = undefined;
    }



    private checkWord(word: string, socketid: string) {

    }

    getRandomWord(): Promise<string> {
        const fetch = require('node-fetch');
        let url = "https://random-word-api.herokuapp.com/word?number=1";
        let settings = {method: "Get"}
        return fetch(url, settings).then((res: any) => res.json()).then((data: any) => {
            return data[0];
        });
        //CODE WILL BE EXECUTED RIGHT AWAY
    }

    //Basicly same with more syntactic-sugar.
    async getRandomWord2(): Promise<string> {
        const fetch = require('node-fetch');
        let url = "https://random-word-api.herokuapp.com/word?number=1";
        let settings = {method: "Get"}
        const data = await fetch(url, settings);
        const word = await data.json();
        //CODE WILL WAIT
        return word[0];
    }

    trans(text: string) {
        let translate = require('node-google-translate-skidz');
        translate({
            text: text,
            source: 'en',
            target: 'de'
        }, function (result: any) {
            console.log(result);
        });
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

    get players(): LinkedList<Connection> {
        return this._players;
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

    get roundStartDate(): number {
        return this._roundStartDate;
    }

    get maxRoundCount(): number {
        return this._maxRoundCount;
    }
}


