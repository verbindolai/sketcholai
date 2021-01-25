import {Server as SocketServer, Socket} from "socket.io";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";

export interface HandlerInterface {
    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io: SocketServer, allConnections : HashMap<string,Connection>): void;
}
