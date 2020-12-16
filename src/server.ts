import {Express, Request, Response} from "express";
import {Server as SocketServer, Socket} from "socket.io";

class SketchServer {

    app : Express;
    io: SocketServer;

    constructor() {
        this.app = require('express').createServer();
        this.io = require('socket.io')(this.app);
        this.app.listen(6969);
    }


    init (): void{


    }

    start (): void {
        this.app.get('/', function (req : Request, res : Response) {
            res.send(__dirname + '/index.html');
        });

        this.io.on('connection', function (socket : Socket) {
            socket.emit('news', "fick dich");
            socket.on('message', function (data) {
                console.log(data);
            });
        });

    }
}
let gay : SketchServer = new SketchServer();
gay.start();
