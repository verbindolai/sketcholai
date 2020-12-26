import {HandlerInterface} from "./handlerInterface";
import {Socket, Server as SocketServer} from "socket.io";
import {GameLobby} from "../gameLobby";
import {Player} from "../player";
import {LinkedList} from "typescriptcollectionsframework";

export class RoomHandler implements HandlerInterface {

    handle(socket: Socket, lobbys : LinkedList<GameLobby>, io : SocketServer): void {

        socket.on('createNewRoom', (name) => {
                let room = new GameLobby(GameLobby.randomString(), 20);
                let creator = new Player(socket.id, name, room.lobbyID);
                room.addPlayer(creator);
                lobbys.add(room);
                socket.join(room.lobbyID);
                socket.emit("roomID", room.lobbyID);
        });


        socket.on('joinRoom', (name, lobbyID) => {
                let lobby = RoomHandler.getLobbyByID(lobbyID, lobbys);
                if (lobby == undefined) {
                    return;
                }
                let player = new Player(socket.id, name, lobby.lobbyID)
                lobby.addPlayer(player);
                socket.join(lobby.lobbyID);
                socket.emit("roomID", lobby.lobbyID);
        });

    }

    public static getRoom(socketID: string, lobbys : LinkedList<GameLobby>) {
        for (let lobby of lobbys) {
            for (let player of lobby.players) {
                if (player.socketID == socketID) {
                    return {player: player, lobby: lobby};
                }
            }
        }
        return undefined;
    }

    public static getLobbyByID(lobbyID : string, lobbys : LinkedList<GameLobby>) : GameLobby | undefined{
        for (let lobby of lobbys) {
            if (lobby.lobbyID == lobbyID){
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
    public static closeRoom (socket : Socket, lobbys : LinkedList<GameLobby>) : boolean {
        let room = RoomHandler.getRoom(socket.id, lobbys);
        let lobby = room?.lobby;
        let player = room?.player;

        if (player == undefined || lobby == undefined){
            return false;
        }

        if(!lobby.removePlayer(player)){
            console.error("Couldn't remove Player!");
            return false;
        }

        if (lobby.players.size() == 0){
            if (!lobbys.remove(lobby)) {
                console.error("Couldn't remove Lobby!");
                return false;
            }
        }
        console.log("Closed Room successfully!");
        return true;
    }

}
export let handler = new RoomHandler();
