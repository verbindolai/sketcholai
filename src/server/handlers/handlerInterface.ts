import {Socket, Server as SocketServer} from "socket.io";
import {LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";

export interface HandlerInterface {
    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io : SocketServer): void;
}
