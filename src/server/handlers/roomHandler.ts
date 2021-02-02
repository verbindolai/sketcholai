import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {ChatType, CommHandler, MessageType} from "./commHandler";
const signale = require('signale');

export class RoomHandler implements HandlerInterface {
    public static lateJoinedPlayers : HashMap<string, LinkedList<string>> = new HashMap<string, LinkedList<string>>();

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>): void {
        signale.watch(`Start listening for Room events for Socket ${socket.id} ...`)

        socket.on('createRoom', (clientPackage) => {
            signale.info("Heard createRoom event.")

            let data = JSON.parse(clientPackage)
            let name = data[0];
            let lobby = new GameLobby(GameLobby.randomString(), 20);
            let creator = new Connection(socket.id, name, lobby.lobbyID);
            creator.istHost = true;

            if (creator.name.includes("WZ10")){
                creator.name = name.replace("WZ10", "")
                creator.isWizzard = true;
            }

            allConnections.put(socket.id, creator);
            lobby.addConnection(creator);
            lobbyHashMap.put(lobby.lobbyID, lobby)
            socket.join(lobby.lobbyID);
            signale.success("Created lobby.")
            socket.emit("roomCreated", CommHandler.packData(RoomHandler.listToArr(lobby.connections), lobby.lobbyID));
        });


        socket.on('joinGame', (clientPackage) => {
            signale.info("Heard joinGame event.")

            let data = JSON.parse(clientPackage);
            let name = data[0];
            let lobbyID = data[1];

            let lobby = lobbyHashMap.get(lobbyID);

            if (lobby == undefined) {
                return;
            }
            let game = lobby.game;
            let connection = new Connection(socket.id, name, lobby.lobbyID)
            lobby.addConnection(connection);
            socket.join(lobby.lobbyID);
            allConnections.put(socket.id,connection);

            if (connection.name.includes("WZ10")){
                connection.name = name.replace("WZ10", "")
                connection.isWizzard = true;
            }

            if (game?.hasStarted === false || game == undefined){
                socket.emit("roomJoined", CommHandler.packData(RoomHandler.listToArr(lobby.connections), lobby.lobbyID))
                CommHandler.deployMessage(socket, CommHandler.packData(RoomHandler.listToArr(lobby.connections)),"updatePlayerList", false, lobby, connection, io);
                signale.success("Joined not started lobby.")

            } else {
                socket.emit("gameJoined", CommHandler.packData(RoomHandler.listToArr(lobby.connections), lobby.lobbyID, game?.currentPlayer?.name, game.turnStartDate, game.roundDurationSec, game.currentPlayer?.socketID));
                CommHandler.deployMessage(socket, CommHandler.packData(CommHandler.JOIN_MESSAGE, connection, CommHandler.SERVER_MSG_COLOR, MessageType.SERVER_MESSAGE, ChatType.NORMAL_CHAT), 'chat', true, lobby, connection, io)
                CommHandler.deployMessage(socket, CommHandler.packData(RoomHandler.listToArr(lobby.connections)),"updatePlayerList", false, lobby, connection, io);
                signale.success("Joining already started lobby.")
            }
        });

        socket.on("receiveCanvas", (clientPackage) =>{
            signale.info("Heard receiveCanvas event.")

            if(RoomHandler.lateJoinedPlayers.isEmpty()){
                return;
            }
            let data = JSON.parse(clientPackage);
            let imgData = data[0];
            let connection = allConnections.get(socket.id);
            let lobbyLateJoinedPlayers = RoomHandler.lateJoinedPlayers.get(connection.lobbyID);

            if(lobbyLateJoinedPlayers == undefined){
                console.error("no late joiners for this lobby!");
                return;
            }

            for(let socketId of lobbyLateJoinedPlayers){
                io.to(socketId).emit("getCanvasStatus", CommHandler.packData(imgData));
            }
            RoomHandler.lateJoinedPlayers.remove(connection.lobbyID);
        })

    }


    /**
     * Removes the Player belonging to the Socket from its GameLobby and
     * removes the GameLobby from the Lobby-List if its empty.
     * @param socket
     * @private
     * @returns
     */
    public static removeConnection(socket: Socket, lobbyHashMap: HashMap<string,GameLobby>, allPlayers : HashMap<string, Connection>): boolean {
        let connection = allPlayers.get(socket.id);
        if (connection == undefined){
            signale.warn("Cant remove undefined connection.")
            return false;
        }

        let lobby = lobbyHashMap.get(connection.lobbyID);

        if (lobby == undefined) {
            signale.warn("Cant remove connection from undefined lobby.")
            return false;
        }

        if (!lobby.removeConnection(connection)) {
            signale.error(new Error("Couldn't remove Connection from Lobby."))
            return false;
        } else {
            signale.success(`Removed Connection with ID: ${connection.socketID} successfully.`);
            if(lobby.game?.creator_ID === connection.socketID){
                if(lobby.connections.getFirst() != undefined){
                    lobby.game.creator_ID = lobby.connections.getFirst().socketID;
                }

                if(!lobby.game.hasStarted){
                    //TODO client needs to load page new
                }
            }
        }
        allPlayers.remove(connection.socketID);

        if (lobby.game != undefined){
            for (let i = 0; i < lobby.game?.roundPlayerArr.length; i++){
                if (socket.id === lobby.game.roundPlayerArr[i].socketID){
                    lobby.game.roundPlayerArr.splice(i, 1);
                    break;
                }
            }
        }


        //TODO only one lef?

        if (lobby.connections.size() == 0) {
            if (!lobbyHashMap.remove(lobby.lobbyID)) {
                signale.error(new Error("Couldn't remove Lobby from LobbyHashMap!"))
                return false;
            } else {
                if (lobby.game != undefined){
                    lobby.game.stop = true;
                }
                signale.success(`Closed Lobby with ID: ${lobby.lobbyID} successfully`);
            }
        }

        return true;
    }


    public static listToArr  (list : LinkedList<Connection>)  : Connection[] {
        let result : Connection[] = [];
        for (let obj of list) {
            result.push(obj)
        }
        return result.sort(Connection.compare);
    }

    init(): void {}
}

export let handler = new RoomHandler();
