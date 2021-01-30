import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";
import {RoomHandler} from "./roomHandler";


export class CommHandler implements HandlerInterface {

    public static readonly SERVER_MSG_COLOR = "#3abd64"
    public static readonly RIGHT_GUESS_MESSAGE = " guessed the word!"
    public static readonly JOIN_MESSAGE = " joined the game."
    public static readonly DRAW_MESSAGE = " is now drawing!"

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>) {
        socket.on('chat', (clientPackage) => {
            let data = JSON.parse(clientPackage);
            let message = data[0].trim();

            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);
            let game = lobby.game;


            if (game == undefined){
                return;
            }

            let currentWord = game.currentWord.trim();

            if (connection.player.guessedCorrectly){
                for (let conn of game.connections){
                    if (conn.player.guessedCorrectly){
                        io.to(conn.socketID).emit("chat", CommHandler.packData(message, connection.name, connection.chatColor, MessageType.CLIENT_MESSAGE, ChatType.GUESSED_CHAT));
                    }
                }
            } else if (message == currentWord){
                connection.player.points += game.GUESS_RIGHT_POINTS * game.pointMultiplicator;
                connection.player.guessedCorrectly = true;
                game.decrementPointMult();
                if (!CommHandler.deployMessage(socket, CommHandler.packData(CommHandler.RIGHT_GUESS_MESSAGE, connection.name, CommHandler.SERVER_MSG_COLOR, MessageType.SERVER_MESSAGE, ChatType.NORMAL_CHAT), 'chat', true, lobby, connection, io)) {
                    console.error("Couldn't deploy Message.")
                }
                CommHandler.deployMessage(socket, CommHandler.packData(RoomHandler.listToArr(lobby.connections)),"updatePlayerList", true, lobby, connection, io);

            } else {
                if (!CommHandler.deployMessage(socket, CommHandler.packData(message, connection.name, connection.chatColor, MessageType.CLIENT_MESSAGE, ChatType.NORMAL_CHAT), 'chat', true, lobby, connection, io)) {
                    console.error("Couldn't deploy Message.")
                }
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
            io.to(lobby.lobbyID).emit(event, data)
        } else {
            socket.broadcast.to(lobby.lobbyID).emit(event, data)
        }
        return true;
    }

    public static packData(...data : any){
        return JSON.stringify(data);
    }

    init(): void {
    }

}

enum MessageType{
    SERVER_MESSAGE,
    CLIENT_MESSAGE,
}

enum ChatType{
    NORMAL_CHAT,
    GUESSED_CHAT,
}

export let handler = new CommHandler();
