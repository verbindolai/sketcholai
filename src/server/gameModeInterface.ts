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
     * Returns all names from every current drawing player
     */
    getCurrentPlayerNames(): string[];  //TODO keine schöne lösung, mir fällt nix besseres ein

    /**
     * Returns a string array SocketIds from every current drawing player
     */
    getCurrentPlayerSocketIDs(): string[];

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

    /**
     * Kicks a player with a specific socketId
     * @param id SocketId of the player which should be kicked
     * @return true if kicked player was last one drawing
     */
    kickPlayerBySocketId(id: string): boolean;

    /**
     * adds a player to the game
     * @param connection player which should be added
     */
    addPlayerToRound(connection: Connection): void;
}