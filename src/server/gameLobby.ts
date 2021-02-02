import {Connection} from "./connection";
import {LinkedList} from "typescriptcollectionsframework";
import {Game} from "./game";

/**
 * Represents a Lobby.
 * @author Christopher Peters, Nikolai Wieczorek
 * @version 1.0
 */
export class GameLobby {

    private readonly _lobbyID: string;
    private _connections: LinkedList<Connection> = new LinkedList<Connection>();
    private readonly limit: number;
    private _game: Game | undefined;
    private _leaderID : string;

    constructor(lobbyID: string, limit: number, leaderID : string) {
        this._lobbyID = lobbyID;
        this.limit = limit;
        this._leaderID = leaderID;
    }

    public addConnection(connection: Connection): boolean {
        if (this._connections.size() < this.limit) {
            this._connections.add(connection);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns the number of Players which are currently in this Lobby.
     */
    public size(): number {
        return this._connections.size()
    }

    public removeConnection(connection: Connection): boolean {
        return this._connections.remove(connection);
    }

    get connections(): LinkedList<Connection> {
        return this._connections;
    }

    get lobbyID(): string {
        return this._lobbyID;
    }

    get leaderID(): string {
        return this._leaderID;
    }

    set leaderID(value: string) {
        this._leaderID = value;
    }

    get game(): Game | undefined {
        return this._game;
    }

    set game(value: Game | undefined) {
        this._game = value;
    }

    public static randomString(): string {
        let length = 15;
        let result = '';
        let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}
