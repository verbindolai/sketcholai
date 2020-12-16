import express, {Express, Request, Response} from "express";
import {Server as SocketServer, Socket} from "socket.io";
import {Server as HTTPServer} from "http"

export class SketchServer {

    app : Express;
    port : number;
    io: SocketServer;

    constructor(port : number) {
        this.port = port;
        this.app = express();
        this.io = new SocketServer(this.startServer(this.port));
    }

    startServer(port : number) : HTTPServer{
        console.log(`Listening on Port ${port} ...`)
        return this.app.listen(port);
    }

    init (): void{


    }

    start (): void {
        this.app.get('/', function (req : Request, res : Response) {
            res.sendFile("C:/Mega/Dev/sketcholai/src/index.html");
        });

        this.io.on('connection', function (socket : Socket) {
            console.log("New Connection!")
            socket.emit('news', "fick dich");
            socket.on('message',  (data) => {
                console.log(`Server received Message:\n${data}`);
            });
        });

    }
}

