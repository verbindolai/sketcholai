import {HandlerInterface} from "./handlerInterface";
import {Socket, Server as SocketServer} from "socket.io";
import {LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommunicationHandler} from "./communicationHandler";
import {RoomHandler} from "./roomHandler";
import {Game} from "../game";

export class GameHandler implements HandlerInterface {

    private readonly drawEvent : string = "draw";
    private readonly fillEvent : string = "fill";

    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io : SocketServer) {
        socket.on(this.drawEvent, (data) => {
            if (!CommunicationHandler.deployMessage(socket, data, this.drawEvent, false, lobbys, io)) {
                console.error("Couldn't deploy draw Message.")
            }
        })

        socket.on(this.fillEvent, (data) => {
            if (!CommunicationHandler.deployMessage(socket, data, this.fillEvent, false, lobbys, io)) {
                console.error("Couldn't deploy fill Message.")
            }
        })

        socket.on('canvasStatus',  (data) => {
            CommunicationHandler.deployMessage(socket, data, 'canvasUpdate', false, lobbys, io)
        })

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
}
export let handler = new GameHandler();
