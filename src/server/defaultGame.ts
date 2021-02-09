import {GameModeInterface} from "./gameModeInterface";
import {Connection} from "./connection";
import {LinkedList} from "typescriptcollectionsframework";
import {signale} from "./server";

export class DefaultGame implements GameModeInterface{
    private _currentPlayer : Connection;
    private _connections : LinkedList<Connection>;
    private _roundPlayers : Connection[];

    init(): void {
    }

    startNextRound(): void {
        for(let player of this._connections){
            this._roundPlayers.push(player);
        }
    }

    initTurn(): void {
        this._currentPlayer = this._roundPlayers[0];
        this._currentPlayer.player.guessedCorrectly = true;
    }

    hasCurrentPlayers(): boolean {
        return this._currentPlayer != undefined;
    }


    getCurrentPlayersSocketIds(): string[] {
        return [this._currentPlayer.socketID];
    }

    endTurn(): boolean {
        this._currentPlayer.player.isDrawing = false;
        this._roundPlayers.splice(0,1);
        for (let conn of this._connections){
            conn.player.guessedCorrectly = false;
        }
        return this._roundPlayers.length == 0;
    }
}