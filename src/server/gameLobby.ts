import {Player} from "./player";
import { LinkedList } from 'linked-list-typescript';

export class GameLobby {

    private readonly id: number;
    private readonly msgChannel: string;
    private players : LinkedList<Player> = new LinkedList<Player>();
    private readonly limit : number;

    constructor(id : number, msgChannel : string, limit : number) {
        this.id = id;
        this.msgChannel = msgChannel;
        this.limit = limit;
    }

    public addPlayer (player : Player) : boolean {
        if (this.players.length < this.limit){
            this.players.append(player);
            return true;
        } else {
            return false;
        }
    }

    public removePlayer(player : Player) {
        this.players.remove(player);
    }
}
