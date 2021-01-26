import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommunicationHandler} from "./communicationHandler";
import {RoomHandler} from "./roomHandler";
import {Game} from "../game";
import {Connection} from "../connection";

export class GameHandler implements HandlerInterface {

    private readonly drawEvent: string = "draw";
    private readonly fillEvent: string = "fill";

    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>) {

        socket.on(this.drawEvent, (data) => {
            const connection = allConnections.get(socket.id);
            if (connection.player.isDrawing && !CommunicationHandler.deployMessage(socket, data, this.drawEvent, false, lobbys, io)) {
                console.error("Couldn't deploy draw Message.")
            }
        })

        socket.on(this.fillEvent, (data) => {
            const connection = allConnections.get(socket.id);
            if (connection.player.isDrawing && !CommunicationHandler.deployMessage(socket, data, this.fillEvent, false, lobbys, io)) {
                console.error("Couldn't deploy fill Message.")
            }
        })

        socket.on('canvasStatus', (data) => {
            CommunicationHandler.deployMessage(socket, data, 'canvasUpdate', false, lobbys, io)
        })

        socket.on('startGameInit', (data) => {  //TODO check data
            let room = RoomHandler.getRoom(socket.id, lobbys);
            CommunicationHandler.deployMessage(socket, room?.lobby.lobbyID, "loadGame", true, lobbys, io);
        });

        socket.on("gameLoaded", (time) => {
            let room = RoomHandler.getRoom(socket.id, lobbys);
            if (room != undefined) {
                room.lobby.game = new Game(room.lobby.lobbyID, time, 3, room.lobby.connections);
                room.lobby.game.init(io);
            } else {
                console.error("room is undefined!");
            }
            CommunicationHandler.deployMessage(socket,null,"gameStarted", true, lobbys, io);
        })

        socket.on("lateJoinGame", (name, lobbyID) => {


        })

    }
}

export let handler = new GameHandler();
