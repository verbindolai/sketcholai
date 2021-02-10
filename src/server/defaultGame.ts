import {GameModeInterface} from "./gameModeInterface";
import {Connection, ReadyStatus} from "./connection";
import {LinkedList} from "typescriptcollectionsframework";
import {signale} from "./server";

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

    getCurrentConnectionNames(): Connection[] {
        return this._currentPlayer == undefined ? [] : [this._currentPlayer];
    }

    getCurrentConnectionSocketIDs(): string[] {
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


}