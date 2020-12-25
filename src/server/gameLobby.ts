import {Player} from "./player";
import {LinkedList} from "typescriptcollectionsframework";

/**
 * Represents a Lobby.
 * @author Christopher Peters, Nikolai Wieczorek
 * @version 1.0
 */
export class GameLobby {

    private readonly _lobbyID: string;
    private _players : LinkedList<Player> = new LinkedList<Player>();
    private readonly limit : number;

    constructor(lobbID : string, limit : number) {
        this._lobbyID = lobbID;
        this.limit = limit;
    }

    public addPlayer (player : Player) : boolean {
        if (this._players.size() < this.limit){
            this._players.add(player);
            player.isInRoom = true;
            return true;
        } else {
            return false;
        }
    }

    public removePlayer(player : Player) : boolean{
       return this._players.remove(player);
    }

    get players(): LinkedList<Player> {
        return this._players;
    }

    get lobbyID(): string {
        return this._lobbyID;
    }

    public static randomString() : string{
        let length = 15;
        let result           = '';
        let characters       = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}
