import {Connection} from "./connection";

export interface GameModeInterface{
    init() : void;
    startNextRound() : void;

    initTurn(): void;

    hasCurrentPlayers(): boolean;

    getCurrentPlayersSocketIds(): string[];

    endTurn(): boolean;
}