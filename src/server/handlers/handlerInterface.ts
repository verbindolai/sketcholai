import {Server as SocketServer, Socket} from "socket.io";
import {HashMap} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";

export interface HandlerInterface {
    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string,Connection>): void;
    init(): void;
}
