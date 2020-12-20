import {Player} from "./player";
import { LinkedList } from 'linked-list-typescript';

export class GameLobby {


    private static maxId : number = 0;
    private readonly _id: number;
    private readonly _msgChannel: string;
    private _players : LinkedList<Player> = new LinkedList<Player>();
    private readonly limit : number;

    constructor(msgChannel : string, limit : number) {
        this._id = GameLobby.maxId;
        this._msgChannel = msgChannel;
        this.limit = limit;
        GameLobby.maxId++;
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

    get id(): number {
        return this._id;
    }

    public static randomString() : string{
        let length = 10;
        let result           = '';
        let characters       = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}
