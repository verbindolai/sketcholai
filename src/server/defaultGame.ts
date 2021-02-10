import {GameModeInterface} from "./gameModeInterface";
import {Connection, ReadyStatus} from "./connection";
import {LinkedList} from "typescriptcollectionsframework";
import {signale} from "./server";
import {RoomHandler} from "./handlers/roomHandler";

export class DefaultGame implements GameModeInterface{
    private _currentPlayer : Connection | undefined;
    private _connections : LinkedList<Connection> = new LinkedList<Connection>();
    private _roundPlayers : Connection[] = [];

    init(connections : LinkedList<Connection>): void {
        this._connections = connections;
    }

    prepareNextRound(): void {
        for(let player of this._connections){
            this._roundPlayers.push(player);
        }
    }

    prepareNextTurn(): void {
        this._currentPlayer = this._roundPlayers[0];
        this._currentPlayer.player.guessedCorrectly = true;
    }

    hasCurrentPlayers(): boolean {
        return this._currentPlayer != undefined;
    }

    getCurrentPlayerNames(): string[] {
        return this._currentPlayer == undefined ? [] : [this._currentPlayer.name];
    }

    getCurrentPlayerSocketIDs(): string[] {
        return this._currentPlayer == undefined ? [] : [this._currentPlayer.socketID];
    }

    endTurn(): boolean {
        if(this._currentPlayer == undefined){
            signale.error("currentPlayer is undefined!")
            return false;
        }
        this._currentPlayer.player.isDrawing = false;
        this._roundPlayers.splice(0,1);
        for (let conn of this._connections){
            conn.player.guessedCorrectly = false;
        }
        return this._roundPlayers.length == 0;
    }

    getPlayerWithHighscore(): Connection | undefined {
        let points = 0;
        let winner;
        for (let conn of this._connections){
            if (conn.player.points >= points){
                points = conn.player.points;
                winner = conn;
            }
        }
        return winner;
    }

    reset(): void {
        for (let conn of this._connections){
            conn.player.reset();
            conn.readyStatus = ReadyStatus.NOT_READY;
        }
    }

    kickPlayerBySocketId(id: string): boolean {
        for (let i = 0; i < this._roundPlayers.length; i++){
            if (id === this._roundPlayers[i].socketID){
                if(id === this._currentPlayer?.socketID){
                    return true;
                }else{
                    this._roundPlayers.splice(i, 1);
                    return false;
                }
            }
        }
        signale.warn("no player found to kick!");
        return false;
    }

    addPlayerToRound(connection: Connection): void {
        this._roundPlayers.push(connection);
    }


}