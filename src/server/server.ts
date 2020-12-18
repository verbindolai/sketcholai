import express, {Express, Request, Response} from "express";
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
    private playerSocket : Map<number,Socket> = new Map<number, Socket>();

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
            res.sendFile("C:/Mega/Dev/sketcholai/public/html/index.html", (err) => {
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
            let player = new Player("TEST")
            this.playerSocket.set(player.id,socket)
            console.log("New Connection!")
            this.handleChat(socket)
            this.handleDisconnect(socket,player)
        })
    }


    private handleDisconnect(socket:Socket, player : Player) : void {
        socket.on('disconnect', (data) => {
            console.log(data)
            console.log("Socket disconnected.")
            this.playerSocket.delete(player.id)
        })
    }

    private handleChat (socket : Socket) {
        socket.on('chat',  (data) =>  {
            console.log(`Server received Message:\n${data}`);

            this.io.emit("chat", data)
        });
    }
}

