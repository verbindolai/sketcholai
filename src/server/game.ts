import {HashMap, HashSet, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";
import {Server as SocketServer} from "socket.io";

export class Game {

    private points: HashMap<string, number> = new HashMap<string, number>();
    private winner: Connection | undefined = undefined;
    private roundPlayerSet : HashSet<Connection> = new HashSet<Connection>();
    private readonly players: LinkedList<Connection>;
    private readonly lobbyId: string;

    private roundCount : number;
    private readonly roundDurationSec: number;
    private roundStartDate: number;
    private readonly maxRoundCount : number;

    private currentPlayer : Connection | undefined;

    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, players: LinkedList<Connection>,) {
        this.players = players;
        this.roundDurationSec = roundDuration;
        this.roundStartDate = 0;
        this.lobbyId = lobbyId;
        this.roundCount = 0;
        this.maxRoundCount = maxRoundCount;
    }

    //Called on game initialization
    public init(io : SocketServer) {
        this.startGameLoop(io)
    }

    private startRound(io : SocketServer){
        this.roundPlayerSet = new HashSet<Connection>();
        for(let player of this.players){
            this.roundPlayerSet.add(player);
        }
        this.currentPlayer = this.roundPlayerSet.iterator().next();
        if (this.currentPlayer == null) { //TODO Right?
            return;
        }
        this.currentPlayer.player.isDrawing = true;
        this.roundStartDate = Date.now();
        io.to(this.lobbyId).emit("gameTime", JSON.stringify([this.roundStartDate, this.roundDurationSec, this.currentPlayer.name, this.currentPlayer.socketID]));
        console.log("started Round: " + this.roundCount)
    }

    private startGameLoop(io : SocketServer){
        this.startRound(io);

        let interval = setInterval(() => {
            //End of the Game
            if (this.roundCount > this.maxRoundCount){
                if (interval != null){
                    clearInterval(interval);
                }

                //TODO send the Gamestate to Clients
                this.resetGame()
                console.log("Ending game...")
                return;
            }

            //End of one Turn
            console.log("Time: " + (Date.now() - this.roundStartDate) / 1000)
            if ((Date.now() - this.roundStartDate) / 1000 > this.roundDurationSec){
                if (this.currentPlayer != undefined){
                    if (this.currentPlayer == null) { //TODO Right?
                        return;
                    }
                    this.currentPlayer.player.isDrawing = false;
                    this.roundPlayerSet.remove(this.currentPlayer);
                    console.log("Turn is over...")
                }

                //End of one Round
                if(this.roundPlayerSet.size() == 0){
                    this.roundCount++;
                    this.startRound(io);
                    console.log("Round is over, next Round starting...")
                } else {
                    this.currentPlayer = this.roundPlayerSet.iterator().next();
                    if (this.currentPlayer == null) { //TODO Right?
                        return;
                    }
                    this.currentPlayer.player.isDrawing = true;
                    this.roundStartDate = Date.now();
                    io.to(this.lobbyId).emit("gameTime", JSON.stringify([this.roundStartDate, this.roundDurationSec , this.currentPlayer.name, this.currentPlayer.socketID]));
                    console.log("Next Player choosen...")
                }

            }

        }, 500)
    }

    private resetGame() {
        this.roundCount = 0;
        this.currentPlayer = undefined;
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

}


