import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";


export class CommunicationHandler implements HandlerInterface {

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>) {
        socket.on('chat', (data) => {
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);
            if (!CommunicationHandler.deployMessage(socket, data, 'chat', true, lobby, connection, io)) {
                console.error("Couldn't deploy Message.")
            }
        });
    }

    /**
     * Deploys a Message to all Members of the Authors-Room
     * @param socket
     * @param data
     * @param event
     * @param include -> wether or not the Author should be included
     * @param lobbyHashMap
     * @param io
     * @private
     */

    public static deployMessage(socket : Socket, data: any, event: string, include: boolean, lobby : GameLobby, connection : Connection, io: SocketServer): boolean {

        if (connection == undefined || lobby == undefined) {
            return false;
        }
        if (include) {
            io.to(lobby.lobbyID).emit(event, JSON.stringify(data))
        } else {
            socket.broadcast.to(lobby.lobbyID).emit(event, JSON.stringify(data))
        }
        return true;
    }

    public static packData(...data : any){

        return JSON.stringify(data);
    }

}

export let handler = new CommunicationHandler();
