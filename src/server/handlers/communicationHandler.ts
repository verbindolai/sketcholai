import {HandlerInterface} from "./handlerInterface";
import {Socket, Server as SocketServer} from "socket.io";
import {LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {RoomHandler} from "./roomHandler";
import {Connection} from "../connection";
import {Game} from "../game";

export class CommunicationHandler implements HandlerInterface{

    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io : SocketServer) {
        socket.on('chat', (data) => {
            if (!CommunicationHandler.deployMessage(socket, data, 'chat', true, lobbys, io)) {
                console.error("Couldn't deploy Message.")
            }
        });
        socket.on('startGame', (data) => {  //TODO check data
            let room = RoomHandler.getRoom(socket.id,lobbys);
            if(room != undefined){
                room.lobby.game = new Game(room.lobby.lobbyID,100,room.lobby.connections);
                room.lobby.game.init(io);
            }else{
                console.error("room is undefined!");
            }
        });
    }

    /**
     * Deploys a Message to all Members of the Authors-Room
     * @param socket
     * @param data
     * @param event
     * @param include -> wether or not the Author should be included
     * @param lobbys
     * @param io
     * @private
     */

    public static deployMessage(socket: Socket, data: any, event: string, include: boolean, lobbys : LinkedList<GameLobby>, io : SocketServer): boolean {
        let room = RoomHandler.getRoom(socket.id, lobbys);
        let author = room?.connection;
        let lobby = room?.lobby;

        if (author == undefined || lobby == undefined) {
            return false;
        }
        let message = new Message<any>(author, data)
        if (include) {
            io.to(lobby.lobbyID).emit(event, JSON.stringify(message))
        } else {
            socket.broadcast.to(lobby.lobbyID).emit(event, JSON.stringify(message))
        }
        return true;
    }
}

class Message<T> {

    author: Connection;
    msg: T;

    constructor(author: Connection, msg: T) {
        this.author = author;
        this.msg = msg;
    }
}
export let handler = new CommunicationHandler();
