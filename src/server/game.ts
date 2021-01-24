import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {Connection} from "./connection";

export class Game {

    private points : HashMap<string, number> = new HashMap<string, number>();
    private winner : Connection | undefined = undefined;
    private readonly players : LinkedList<Connection>;

    constructor(players : LinkedList<Connection>) {
        this.players = players;
    }

    private init() {
        this.chooseTurn();
    }

    private start() {
        //Start Timer
    }

    private chooseTurn() {

    }

    private checkWord(word : string, socketid : string) {

    }

    getRandomWord() : Promise<string>{
        const fetch = require('node-fetch');
        let url = "https://random-word-api.herokuapp.com/word?number=1";
        let settings = { method: "Get" }
        return fetch(url, settings).then((res : any) => res.json()).then((data : any) => {
            return data[0];
        });
        //CODE WILL BE EXECUTED RIGHT AWAY
    }

    //Basicly same with more syntactic-sugar.
    async getRandomWord2() : Promise<string>{
        const fetch = require('node-fetch');
        let url = "https://random-word-api.herokuapp.com/word?number=1";
        let settings = { method: "Get" }
        const data = await fetch(url, settings);
        const word = await data.json();
        //CODE WILL WAIT
        return word[0];
    }

    trans(text: string){
        let translate = require('node-google-translate-skidz');
        translate({
            text: text,
            source: 'en',
            target: 'de'
        }, function(result : any) {
            console.log(result);
        });
    }

}


