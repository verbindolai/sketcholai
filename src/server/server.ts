import express, {Express, Request, Response} from "express";
import {Server as SocketServer, Socket} from "socket.io";
import {Server as HTTPServer} from "http"
import {GameLobby} from "./gameLobby"
import {LinkedList} from "typescriptcollectionsframework";
import {RoomHandler} from "./handlers/roomHandler";
import {HandlerInterface} from "./handlers/handlerInterface";
import * as fs from "fs";

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
    private handlerObjects : LinkedList<HandlerInterface>


    constructor(port: number) {
        this._port = port;
        this.app = express();
        this.io = new SocketServer(this.startServer(this._port));
        this.handlerObjects = new LinkedList<HandlerInterface>();
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
        this.addHandlers();
        this.app.use(express.static('./public'));
    }

    /**
     * Starts the Request- and Websocket-Handling
     */
    public start(): void {
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
            this.startHandlers(socket);
            this.handleDisconnect(socket);
        })
    }

    private handleDisconnect(socket: Socket): void {
        socket.on('disconnect', (data) => {
            let room = RoomHandler.getRoom(socket.id, this.lobbys);
            let player = room?.player;
            let lobby = room?.lobby;

            if (player == undefined || lobby == undefined){
                console.error("Disconnect Error, Lobby or Player is undefined.")
                return;
            }

            if(!RoomHandler.removePlayer(socket, this.lobbys)) {
                console.error("Couldn't delete Lobby.")
            }
        })
    }

    private startHandlers(socket : Socket) : void{
        for (const handler of this.handlerObjects) {
            handler.handle(socket, this.lobbys, this.io)
        }
    }




    private addHandlers() : void{
        const handlerFiles = fs.readdirSync('src/server/handlers').filter(file => file.endsWith('.ts') && file !== 'handlerInterface.ts');
        for (const file of handlerFiles) {
            const fileWithoutTS = file.replace(".ts","");
            let command = require(`./handlers/${fileWithoutTS}`);
            this.handlerObjects.add(command.handler)
        }
    }

}

