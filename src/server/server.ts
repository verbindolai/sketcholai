import express, {Express, json, Request, Response} from "express";
import {Server as SocketServer, Socket} from "socket.io";
import {Server as HTTPServer} from "http"
import {Player} from "./player";
import {GameLobby} from "./gameLobby"
import {LinkedList} from 'linked-list-typescript';


/**
 * Represents the Sketch-Server
 * @author Christopher Peters, Mathusan Kannathasan, Nikolai Wieczorek
 * @version 1.0
 */
export class SketchServer {

    private app: Express;
    private readonly _port: number;
    private io: SocketServer;
    private lobbys: LinkedList<GameLobby> = new LinkedList<GameLobby>();


    constructor(port: number) {
        this._port = port;
        this.app = express();
        this.io = new SocketServer(this.startServer(this._port));
        this.init();
    }

    /**
     * Getter for the Port
     */
    public get port() {
        return this._port;
    }

    /**
     * Returns a HTTP-Server Object
     * @param port : port to listen on
     * @private
     */

    private startServer(port: number): HTTPServer {
        console.log(`Listening on Port ${port} ...`)
        return this.app.listen(port);
    }

    /**
     * Initialises something
     * @private
     */
    private init(): void {
        this.app.use(express.static('./public'));
    }

    /**
     * Starts the Request- and Websocket-Handling
     */
    public start(): void {
        this.init();
        this.getRequestHandler();
        this.websocketHandler();
    }

    /**
     * Handles GET-Request to the HTTP-Server
     * @private
     */
    private getRequestHandler(): void {
        this.app.get('/', function (req: Request, res: Response) {
            res.sendFile(process.cwd() + "/public/html/index.html", (err) => {
                if (err) {
                    console.error("There was an error sending the Response-File.")
                }
            });
        });
    }

    /**
     * Handles Websocket-Events
     * @private
     */
    private websocketHandler(): void {
        this.io.on('connection', (socket: Socket) => {
            this.handleCreateRoom(socket);
            this.handleJoinRoom(socket);
            this.handleChat(socket);
            this.handleDraw(socket);
            this.handleDisconnect(socket);
        })
    }

    private handleDisconnect(socket: Socket): void {
        socket.on('disconnect', (data) => {

            // let room = this.getRoom(socket.id);
            // let player = room?.player;
            // let lobby = room?.lobby;
            //
            // if (player == undefined || lobby == undefined){
            //     return;
            // }
            //
            // lobby?.removePlayer(player);
            //
            // if(!this.deleteLobbyIfEmpty(socket)) {
            //     console.error("Couldn't delete Lobby.")
            // }
        })
    }
    private handleChat(socket: Socket) {
        socket.on('chat', (data) => {
            if (!this.deployMessage(socket, data, 'chat', true)) {
                console.error("Couldn't deploy Message.")
            }
        });
    }
    private handleDraw(socket: Socket) {
        socket.on("draw", (data) => {
            if (!this.deployMessage(socket, data, 'draw', false)) {
                console.error("Couldn't deploy Message.")
            }
        })
    }
    private handleCreateRoom(socket: Socket) {
        socket.on('createNewRoom', (name) => {
            let room = new GameLobby(GameLobby.randomString(), 20);
            let creator = new Player(socket.id, name, room.lobbyID);
            room.addPlayer(creator);
            this.lobbys.append(room);
            socket.join(room.lobbyID);
            socket.send("Room ID: " + room.lobbyID);
            console.log(room.lobbyID)
        });

    }
    private handleJoinRoom(socket: Socket) {
        socket.on('joinRoom', (name, lobbyID) => {
            let lobby = this.getLobbyByID(lobbyID);

            if (lobby == undefined) {
                return;
            }
            let player = new Player(socket.id, name, lobby.lobbyID)
            lobby.addPlayer(player);
            socket.join(lobby.lobbyID);

        });
    }

    private deleteLobbyIfEmpty (socket : Socket) : boolean {
        let room = this.getRoom(socket.id);
        console.log(room)
        let lobby = room?.lobby;
        if (lobby != undefined){
            if (lobby.players.length == 0){
                this.lobbys.remove(lobby);
                return true
            }
        }
        return false;
    }

    /**
     * Deploys a Message to all Members of the Authors-Room
     * @param socket
     * @param data
     * @param event
     * @param include -> wether or not the Author should be included
     * @private
     */
    private deployMessage(socket: Socket, data: any, event: string, include: boolean): boolean {
        let room = this.getRoom(socket.id);
        let author = room?.player;
        let lobby = room?.lobby;

        if (author == undefined || lobby == undefined) {
            return false;
        }
        let message = new Message<any>(author, data)
        if (include) {
            this.io.to(lobby.lobbyID).emit(event, JSON.stringify(message))
        } else {
            socket.broadcast.to(lobby.lobbyID).emit(event, JSON.stringify(message))
        }
        return true;

    }

    private getRoom(socketID: string) {
        for (let lobby of this.lobbys) {
            for (let player of lobby.players) {
                if (player.socketID == socketID) {
                    return {player: player, lobby: lobby};
                }
            }
        }
        return undefined
    }

    private getLobbyByID(lobbyID : string) : GameLobby | undefined{
        for (let lobby of this.lobbys) {
            if (lobby.lobbyID == lobbyID){
                return lobby;
            }
        }
        return undefined
    }

}

class Message<T> {

    author: Player;
    msg: T;

    constructor(author: Player, msg: T) {
        this.author = author;
        this.msg = msg;
    }
}
