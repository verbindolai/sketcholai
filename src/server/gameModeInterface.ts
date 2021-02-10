import {Connection} from "./connection";
import {LinkedList} from "typescriptcollectionsframework";

export interface GameModeInterface{
    /**
     * Initializes the game mode, should only be called upon game start
     * @param connections List of all connected players
     */
    init(connections : LinkedList<Connection>) : void;

    /**
     * Prepares the game mode for the next round
     */
    prepareNextRound() : void;

    /**
     * Prepares the game mode for the next turn
     */
    prepareNextTurn(): void;

    /**
     * Returns true if there is at least one current player
     */
    hasCurrentPlayers(): boolean;

    /**
     * Returns all names of every Connection as an array
     */
    getCurrentConnectionNames(): string[];  //TODO keine schöne lösung

    /**
     * Returns a string array SocketIds from every connected player
     */
    getCurrentConnectionSocketIDs(): string[];

    /**
     * ends a turn. Returns true if the round has ended
     */
    endTurn(): boolean;

    /**
     * Gets the Connection of the player with the highscore
     */
    getPlayerWithHighscore(): Connection | undefined;

    /**
     * resets the game
     */
    reset(): void;
}