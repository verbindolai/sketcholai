import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";
import {Server as SocketServer} from "socket.io";


export class Game {

    private points: HashMap<string, number> = new HashMap<string, number>();
    private winner: Connection | undefined = undefined;
    private readonly players: LinkedList<Connection>;
    private readonly lobbyId: string;

    private readonly roundDurationMs: number;
    private roundStartDate: number;

    constructor(lobbyId: string, roundDuration: number, players: LinkedList<Connection>,) {
        this.players = players;
        this.roundDurationMs = roundDuration;
        this.roundStartDate = 0;
        this.lobbyId = lobbyId;
    }

    //Called on game initialization
    public init(server: SocketServer) {
        this.chooseTurn();
        this.startRound(server)
    }

    //Called upon every round start
    private startRound(server: SocketServer) {
        this.roundStartDate = Date.now();
        this.chooseTurn();
        //Start Timer
        //Send timestamp to client
        server.to(this.lobbyId).emit("gameTime", JSON.stringify(this.roundStartDate));
        const timer = setTimeout(() => {
            this.endRound();
        }, this.roundDurationMs);
    }

    private endRound() {

    }

    private chooseTurn() {

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


