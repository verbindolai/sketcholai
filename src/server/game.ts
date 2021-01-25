import {HashMap, HashSet, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";
import {Server as SocketServer} from "socket.io";


export class Game {

    private points: HashMap<string, number> = new HashMap<string, number>();
    private winner: Connection | undefined = undefined;
    private roundPlayerSet : HashSet<Connection> = new HashSet<Connection>();

    private readonly server : SocketServer;
    private readonly players: LinkedList<Connection>;
    private readonly lobbyId: string;

    private roundCount : number;
    private readonly roundDurationMs: number;
    private roundStartDate: number;
    private readonly maxRoundCount : number;

    constructor(lobbyId: string, roundDuration: number, maxRoundCount : number, server : SocketServer, players: LinkedList<Connection>,) {
        this.players = players;
        this.roundDurationMs = roundDuration;
        this.roundStartDate = 0;
        this.lobbyId = lobbyId;
        this.roundCount = 0;
        this.maxRoundCount = maxRoundCount;
        this.server = server;
    }

    //Called on game initialization
    public init() {
        this.startGameLoop()
    }

    private startGameLoop(){

    }

    private startRound(){
        this.roundPlayerSet = new HashSet<Connection>();
        for(let player of this.players){
            this.roundPlayerSet.add(player);
        }
    }

    //Called upon every round start
    private startTurn() {
        this.roundStartDate = Date.now();
        this.server.to(this.lobbyId).emit("gameTime", JSON.stringify(this.roundStartDate));
        let connection : Connection = this.roundPlayerSet.iterator().next();
        connection.player.isDrawing = true;
        return new Promise<Connection>((resolve, reject) => {
            setTimeout(() => {
                resolve(connection);
            }, this.roundDurationMs);
        })
        //Send infos
    }

    private endTurn(connection : Connection){
        connection.player.isDrawing = false;
        this.roundPlayerSet.remove(connection);
        return new Promise<boolean>(((resolve, reject) => {
            if(this.roundPlayerSet.isEmpty()){
                this.endRound();
            }else{
                this.startTurn().then((conn)=> this.endTurn(conn));
            }
        }))
        //Send infos
    }

    private endRound() {
        this.roundCount++;
        if(this.roundCount < this.maxRoundCount){
            this.startTurn();
        }
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


