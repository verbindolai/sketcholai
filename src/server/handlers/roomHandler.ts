import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {CommunicationHandler} from "./communicationHandler";


export class RoomHandler implements HandlerInterface {
    private lateJoinedPlayers : HashMap<string, LinkedList<string>> = new HashMap<string, LinkedList<string>>();

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>): void {

        socket.on('createRoom', (clientPackage) => {
            let data = JSON.parse(clientPackage)
            let name = data[0];

            let lobby = new GameLobby(GameLobby.randomString(), 20);
            let creator = new Connection(socket.id, name, lobby.lobbyID);

            allConnections.put(socket.id, creator);
            lobby.addConnection(creator);
            lobbyHashMap.put(lobby.lobbyID, lobby)
            socket.join(lobby.lobbyID);

            socket.emit("roomCreated", CommunicationHandler.packData(RoomHandler.listToArr(lobby.connections), lobby.lobbyID));
        });


        socket.on('joinGame', (clientPackage) => {
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


            if (game?.hasStarted === false || game == undefined){
                socket.emit("roomJoined", CommunicationHandler.packData(RoomHandler.listToArr(lobby.connections), lobby.lobbyID))
                CommunicationHandler.deployMessage(socket, CommunicationHandler.packData(RoomHandler.listToArr(lobby.connections)),"updatePlayerList", false, lobby, connection, io);
            } else {
                socket.emit("gameJoined", CommunicationHandler.packData(RoomHandler.listToArr(lobby.connections), lobby.lobbyID, game?.currentPlayer?.name, game.roundStartDate, game.roundDurationSec, game.currentPlayer?.socketID));

                CommunicationHandler.deployMessage(socket, CommunicationHandler.packData(RoomHandler.listToArr(lobby.connections)),"updatePlayerList", false, lobby, connection, io);
                if(this.lateJoinedPlayers.containsKey(lobbyID)){
                    this.lateJoinedPlayers.get(lobbyID).add(socket.id);
                }else{
                    const newSocketIdList = new LinkedList<string>();
                    newSocketIdList.add(socket.id);
                    this.lateJoinedPlayers.put(lobbyID,newSocketIdList);
                }
                //Sends a request to all other connections in the room to send the current canvas status to the server
                CommunicationHandler.deployMessage(socket,null, "sendCanvasStatus", false, lobby, connection, io);

            }
        });

        socket.on("receiveCanvas", (clientPackage) =>{
            if(this.lateJoinedPlayers.isEmpty()){
                return;
            }
            let data = JSON.parse(clientPackage);
            let imgData = data[0];
            let connection = allConnections.get(socket.id);
            let lobbyLateJoinedPlayers = this.lateJoinedPlayers.get(connection.lobbyID);

            if(lobbyLateJoinedPlayers == undefined){
                console.error("no late joiners for this lobby!");
                return;
            }

            for(let socketId of lobbyLateJoinedPlayers){
                io.to(socketId).emit("getCanvasStatus", CommunicationHandler.packData(imgData));
            }
            this.lateJoinedPlayers.remove(connection.lobbyID);
        })

    }


    public static getLobbyByID(lobbyID: string, lobbys: LinkedList<GameLobby>): GameLobby | undefined {
        for (let lobby of lobbys) {
            if (lobby.lobbyID == lobbyID) {
                return lobby;
            }
        }
        return undefined;
    }

    /**
     * Removes the Player belonging to the Socket from its GameLobby and
     * removes the GameLobby from the Lobby-List if its empty.
     * @param socket
     * @private
     * @returns
     */
    public static removePlayer(socket: Socket, lobbyHashMap: HashMap<string,GameLobby>, allPlayers : HashMap<string, Connection>): boolean {
        let player = allPlayers.get(socket.id);
        let lobby = lobbyHashMap.get(player.lobbyID);

        if (player == undefined || lobby == undefined) {
            return false;
        }

        if (!lobby.removeConnection(player)) {
            console.error("Couldn't remove Player!");
            return false;
        }
        allPlayers.remove(player.socketID);

        //TODO only one lef?

        if (lobby.connections.size() == 0) {
            if (!lobbyHashMap.remove(lobby.lobbyID)) {
                console.error("Couldn't remove Lobby!");
                return false;
            } else {
                console.log("Closed Room successfully!");
            }
        }

        return true;
    }


    public static listToArr <T> (list : LinkedList<T>)  : T[] {
        let result : T[] = [];
        for (let obj of list) {
            result.push(obj)
        }
        return result;
    }

}

export let handler = new RoomHandler();
