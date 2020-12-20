import express, {Express, json, Request, Response} from "express";
import {Server as SocketServer, Socket} from "socket.io";
import {Server as HTTPServer} from "http"
import {Player} from "./player";
import {GameLobby} from "./gameLobby"
import { LinkedList } from 'linked-list-typescript';


/**
 * Represents the Sketch-Server
 * @author Christopher Peters, Mathusan Kannathasan, Nikolai Wieczorek
 * @version 1.0
 */
export class SketchServer {

    private app : Express;
    private readonly _port : number;
    private io: SocketServer;
    private lobbys : LinkedList<GameLobby> = new LinkedList<GameLobby>();
    private playerSocket : Map<string, number> = new Map<string, number>();

    constructor(port : number) {
        this._port = port;
        this.app = express();
        this.io = new SocketServer(this.startServer(this._port));
        this.init();
    }

    /**
     * Getter for the Port
     */
    public get port(){
        return this._port;
    }

    /**
     * Returns a HTTP-Server Object
     * @param port : port to listen on
     * @private
     */

    private startServer(port : number) : HTTPServer{
        console.log(`Listening on Port ${port} ...`)
        return this.app.listen(port);
    }

    /**
     * Initialises something
     * @private
     */
    private init (): void{
        this.app.use(express.static('./public'));
    }

    /**
     * Starts the Request- and Websocket-Handling
     */
    public start (): void {
        this.init();
        this.getRequestHandler();
        this.websocketHandler();
    }

    /**
     * Handles GET-Request to the HTTP-Server
     * @private
     */
    private getRequestHandler() : void{
        this.app.get('/', function (req : Request, res : Response) {
            res.sendFile(process.cwd() + "/public/html/index.html", (err) => {
                if (err){
                    console.error("There was an error sending the Response-File.")
                } else {
                    console.log("Response-File transmitted.")
                }
            });
        });
        this.app.get('/lobby', function (req : Request, res : Response) {
            res.sendFile(process.cwd() + "/public/html/lobby.html", (err) => {
                if (err){
                    console.error("There was an error sending the Response-File.")
                } else {
                    console.log("Response-File transmitted.")
                }
            });
        });

    }

    /**
     * Handles Websocket-Events
     * @private
     */
    private websocketHandler() : void {
        this.io.on('connection',  (socket : Socket) => {
            this.handleCreateRoom(socket);
            this.handelJoinRoom(socket);
            this.handleChat(socket);
            this.handleDisconnect(socket);
        })
    }


    private handleDisconnect(socket:Socket) : void {
        socket.on('disconnect', (data) => {
            if (!this.playerSocket.delete(socket.id)) {
                console.error("Couldn't remove this Socket.")
            }
        })
    }

    private handleChat (socket : Socket) {
        socket.on('chat',  (data) =>  {

            let author;
            let authorID = this.playerSocket.get(socket.id);
            if (authorID != undefined){
                author = this.getPlayerByID(authorID);
                if (author != undefined){
                    let message = new Message<any>(author, data)
                    let lobby = this.getLobbyByID(author.lobbyID);
                    if (lobby != undefined){
                        this.io.to(lobby.msgChannel).emit("chat", JSON.stringify(message))
                    }
                }
            }
        });
    }

    private getPlayerByID(id : number) : Player | undefined{
        for (let lobby of this.lobbys){
            for (let player of lobby.players){
                if (player.id == id){
                    return player;
                }
            }
        }
        return undefined
    }

    private getLobbyByID(id :number) : GameLobby | undefined{
        for (let lobby of this.lobbys){
            if (lobby.id == id) {
                return lobby;
            }
        }
        return undefined;
    }

    private handleCreateRoom (socket : Socket){

        socket.on('createNewRoom', (name) => {
            let room = new GameLobby(GameLobby.randomString(), 20);
            let creator = new Player(name, room.id);
            this.playerSocket.set(socket.id, creator.id);
            room.addPlayer(creator);
            this.lobbys.append(room);
            socket.join(room.msgChannel);
            socket.send("Room ID: " +room.id);
        });

    }

    private handleDraw(socket : Socket){
        //TODO
    }

    private handelJoinRoom(socket : Socket){
        socket.on('joinRoom', (name, roomID) => {
            let room = this.getLobbyByID(roomID);

            if (room == undefined){
                return;
            }
            let player = new Player(name, room.id)
            this.playerSocket.set(socket.id, player.id);
            room.addPlayer(player);
            socket.join(room.msgChannel);

        });
    }

    private handleDeleteRoom (socket : Socket, lobby : GameLobby) {

        socket.off(lobby.msgChannel, this.listener);

    }

    listener (data : number) {

    }


}

class Message<T> {

    author: Player | undefined;
    msg: T;

    constructor(author: Player, msg: T) {
        this.author = author;
        this.msg = msg;
    }
}
