import express, {Express, Request, Response} from "express";
import {Server as SocketServer, Socket} from "socket.io";
import {Server as HTTPServer} from "http"
import {GameLobby} from "./gameLobby"
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {RoomHandler} from "./handlers/roomHandler";
import {HandlerInterface} from "./handlers/handlerInterface";
import * as fs from "fs";
import {Connection} from "./connection";
import {CommHandler} from "./handlers/commHandler";
const signale = require('signale');
/**
 * Represents the Sketch-Server
 * @author Christopher Peters, Mathusan Kannathasan, Nikolai Wieczorek
 * @version 1.0
 */
export class SketchServer {

    private app: Express;
    private readonly _port: number;
    private readonly io: SocketServer;
    private readonly handlerObjects: LinkedList<HandlerInterface>
    private lobbies: HashMap<string, GameLobby> = new HashMap<string, GameLobby>();
    private allConnections : HashMap<string, Connection> = new HashMap<string, Connection>();



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
        signale.watch(`Listening on Port ${port} ...`)
        return this.app.listen(port);

    }

    /**
     * Initialises something
     * @private
     */
    private init(): void {
        this.addHandlers();
        this.app.use(express.static('./public'));
        for(let handler of this.handlerObjects){
            handler.init();
        }
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
                    signale.error(new Error("There was an error sending the Response-File."))
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
            signale.info("Heard connection event.")
            this.startHandlers(socket);
            this.handleDisconnect(socket);
        })
    }

    private handleDisconnect(socket: Socket): void {
        socket.on('disconnect', (data) => {
            signale.info("Heard disconnect event.")
            let connection = this.allConnections.get(socket.id);

            if (connection == undefined) {
                signale.warn("Cant disconnect, connection not found.")
                return;
            }

            let lobby = this.lobbies.get(connection.lobbyID);

            if (lobby == undefined) {
                signale.warn("Cant disconnect, lobby not found.")
                return;
            }

            if (!RoomHandler.removeConnection(socket, this.lobbies, this.allConnections, this.io)) {
                signale.error(new Error("Couldn't remove player!"))
            }
            CommHandler.deployMessage(socket, CommHandler.packData(RoomHandler.listToArr(lobby.connections)),"updatePlayerList", false, lobby, connection, this.io);
        })
    }

    private startHandlers(socket: Socket): void {
        for (const handler of this.handlerObjects) {
            handler.handle(socket, this.lobbies, this.io, this.allConnections)
        }
        signale.success("Started handlers.")
    }


    private addHandlers(): void {
        const handlerFiles = fs.readdirSync('src/server/handlers').filter(file => file.endsWith('.ts') && file !== 'handlerInterface.ts');
        for (const file of handlerFiles) {
            const fileWithoutTS = file.replace(".ts", "");
            let handler = require(`./handlers/${fileWithoutTS}`);
            if(!this.handlerObjects.add(handler.handler)){
                signale.error(new Error("Handler couldn't be loaded!"))
            }
        }
    }

}

