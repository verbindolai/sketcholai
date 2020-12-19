import {Player} from "./player";
import { LinkedList } from 'linked-list-typescript';

export class GameLobby {

    private readonly id: number;
    private readonly _msgChannel: string;
    private _players : LinkedList<Player> = new LinkedList<Player>();
    private readonly limit : number;

    constructor(id : number, msgChannel : string, limit : number) {
        this.id = id;
        this._msgChannel = msgChannel;
        this.limit = limit;
    }

    public addPlayer (player : Player) : boolean {
        if (this._players.length < this.limit){
            this._players.append(player);
            player.isInRoom = true;
            return true;
        } else {
            return false;
        }
    }

    public removePlayer(player : Player) {
        this._players.remove(player);
    }


    get players(): LinkedList<Player> {
        return this._players;
    }

    get msgChannel(): string {
        return this._msgChannel;
    }
}
