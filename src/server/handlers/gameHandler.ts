import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommunicationHandler} from "./communicationHandler";
import {Game} from "../game";
import {Connection} from "../connection";

export class GameHandler implements HandlerInterface {

    private readonly drawEvent: string = "draw";
    private readonly fillEvent: string = "fill";

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>) {

        socket.on(this.drawEvent, (clientPackage) => {
            const data = JSON.parse(clientPackage);
            const drawInfoPackage = data[0];
            const connection = allConnections.get(socket.id);
            if(connection == undefined) {
                return;
            }
            const lobby = lobbyHashMap.get(connection.lobbyID)
            if(lobby == undefined) {
                return;
            }
            if (connection.player.isDrawing && !CommunicationHandler.deployMessage(socket, CommunicationHandler.packData(drawInfoPackage), this.drawEvent, false, lobby, connection, io)) {
                console.error("Couldn't deploy draw Message.")
            }
        })

        socket.on(this.fillEvent, (clientPackage) => {
            const data = JSON.parse(clientPackage);
            const drawInfoPackage = data[0];
            const connection = allConnections.get(socket.id);
            if(connection == undefined) {
                return;
            }
            const lobby = lobbyHashMap.get(connection.lobbyID)
            if(lobby == undefined) {
                return;
            }
            if (connection.player.isDrawing && !CommunicationHandler.deployMessage(socket, CommunicationHandler.packData(drawInfoPackage), this.fillEvent, false, lobby, connection, io)) {
                console.error("Couldn't deploy fill Message.")
            }
        })

        socket.on('initGame', (clientPackage) => {
            let data = JSON.parse(clientPackage);
            let drawTime = data[0];
            let roundNum = data[1];
            //TODO check rdy status
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);

            if (connection == undefined || lobby == undefined){
                console.error("Cant init Game, connection or lobby is undefined.")
                return;
            }

            lobby.game = new Game(lobby.lobbyID, drawTime, roundNum, lobby.connections);
            CommunicationHandler.deployMessage(socket, CommunicationHandler.packData(lobby.lobbyID, lobby.game.currentPlayer?.name), "loadGame", true, lobby, connection, io);
        })

        socket.on('startGame', (clientPackage) => {
            let data = JSON.parse(clientPackage);
            let statusCode = data[0];
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);

            if (lobby.game?.hasStarted === false){
                lobby.game.init(io);
            }

        });
    }
}

export let handler = new GameHandler();
