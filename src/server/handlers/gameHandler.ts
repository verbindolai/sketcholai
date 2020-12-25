import {HandlerInterface} from "./handlerInterface";
import {Socket, Server as SocketServer} from "socket.io";
import {LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommunicationHandler} from "./communicationHandler";

export class GameHandler implements HandlerInterface {

    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io : SocketServer) {
        socket.on("draw", (data) => {
            if (!CommunicationHandler.deployMessage(socket, data, 'draw', false, lobbys, io)) {
                console.error("Couldn't deploy Message.")
            }
        })
    }
}
export let handler = new GameHandler();
