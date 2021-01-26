import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {GameLobby} from "../gameLobby";
import {Connection} from "../connection";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {CommunicationHandler} from "./communicationHandler";


export class RoomHandler implements HandlerInterface {

    handle(socket: Socket, lobbys: LinkedList<GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>): void {

        socket.on('createNewRoom', (name) => {
            let room = new GameLobby(GameLobby.randomString(), 20);
            let creator = new Connection(socket.id, name, room.lobbyID);
            allConnections.put(socket.id,creator);
            room.addPlayer(creator);
            lobbys.add(room);
            socket.join(room.lobbyID);
            socket.emit("created",JSON.stringify([RoomHandler.listToArr(room.connections), room.lobbyID]));
        });


        socket.on('joinRoom', (name, lobbyID) => {
            let lobby = RoomHandler.getLobbyByID(lobbyID, lobbys);
            if (lobby == undefined) {
                return;
            }
            let player = new Connection(socket.id, name, lobby.lobbyID)
            lobby.addPlayer(player);
            socket.join(lobby.lobbyID);
            allConnections.put(socket.id,player);
            socket.emit("joined", JSON.stringify([RoomHandler.listToArr(lobby.connections), lobby.lobbyID]));
            CommunicationHandler.deployMessage(socket, JSON.stringify([RoomHandler.listToArr(lobby.connections), lobby.lobbyID]), "newPlayerJoined",false ,lobbys, io);
            if (lobby.size() > 1) {
                //socket.broadcast.to(lobby.connections.getFirst().socketID).emit('canvasStatus', true);
            }
        });

    }

    public static getRoom(socketID: string, lobbys: LinkedList<GameLobby>) {
        for (let lobby of lobbys) {
            for (let connection of lobby.connections) {
                if (connection.socketID == socketID) {
                    return {connection: connection, lobby: lobby};
                }
            }
        }
        return undefined;
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
    public static removePlayer(socket: Socket, lobbys: LinkedList<GameLobby>, allPlayers : HashMap<string, Connection>): boolean {
        let room = RoomHandler.getRoom(socket.id, lobbys);
        let lobby = room?.lobby;
        let player = room?.connection;

        if (player == undefined || lobby == undefined) {
            return false;
        }

        if (!lobby.removePlayer(player)) {
            console.error("Couldn't remove Player!");
            return false;
        }
        allPlayers.remove(player.socketID);

        //TODO only one lef?

        if (lobby.connections.size() == 0) {
            if (!lobbys.remove(lobby)) {
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
