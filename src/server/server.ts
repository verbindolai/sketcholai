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
        this.app.use(express.static('./build/client'));
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
            console.log(socket.rooms);
            let message = new Message<any>(new Player("test"), data)
            this.io.emit("chat", JSON.stringify(message))
        });
    }


    private handleCreateRoom (socket : Socket){
        console.log("Room handler")
        socket.on('createNewRoom', (name) => {
            console.log("Handling new Room request..")
            let creator = new Player(name);
            this.playerSocket.set(socket.id, creator.id);
            let room = new GameLobby(1, "RANDOM CODE", 20);
            room.addPlayer(creator);
            socket.join(room.msgChannel);
            console.log(socket.rooms)
        })

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
