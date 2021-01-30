import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommHandler} from "./commHandler";
import {Game, GameState} from "../game";
import {Connection} from "../connection";
import {RoomHandler} from "./roomHandler";
import * as fs from "fs";

export class GameHandler implements HandlerInterface {

    private readonly drawEvent: string = "draw";
    private readonly fillEvent: string = "fill";
    private _words : string[] = [];

    init(){
        let rawData = fs.readFileSync("./src/server/handlers/words.txt","utf8");
        this._words = rawData.split("\n");
    }


    // private jsonToTxt(){
    //     let rawData = fs.readFileSync("./src/server/handlers/words.json","utf16le").substr(1);
    //     const list = JSON.parse(rawData);
    //     for(let word in list){
    //         fs.appendFileSync("./src/server/handlers/words.txt",word + "\n");
    //     }
    //     console.log("feddich");
    // }

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>) {

        socket.on(this.drawEvent, (clientPackage) => {
            const data = JSON.parse(clientPackage);
            const drawInfoPackage = data[0];
            const connection = allConnections.get(socket.id);
            if(connection == undefined) {
                return;
            }
            const lobby = lobbyHashMap.get(connection.lobbyID)
            if(lobby == undefined) {
                return;
            }
            if (connection.player.isDrawing && !CommHandler.deployMessage(socket, CommHandler.packData(drawInfoPackage), this.drawEvent, false, lobby, connection, io)) {
                console.error("Couldn't deploy draw Message.")
            }
        })

        socket.on(this.fillEvent, (clientPackage) => {
            const data = JSON.parse(clientPackage);
            const drawInfoPackage = data[0];
            const connection = allConnections.get(socket.id);
            if(connection == undefined) {
                return;
            }
            const lobby = lobbyHashMap.get(connection.lobbyID)
            if(lobby == undefined) {
                return;
            }
            if (connection.player.isDrawing && !CommHandler.deployMessage(socket, CommHandler.packData(drawInfoPackage), this.fillEvent, false, lobby, connection, io)) {
                console.error("Couldn't deploy fill Message.")
            }
        })

        socket.on('initGame', (clientPackage) => {
            let data = JSON.parse(clientPackage);
            let drawTime = data[0];
            let roundNum = data[1];
            //TODO check rdy status
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);

            if (connection == undefined || lobby == undefined){
                console.error("Cant init Game, connection or lobby is undefined.")
                return;
            }

            lobby.game = new Game(lobby.lobbyID, drawTime, roundNum, lobby.connections, this._words);
            CommHandler.deployMessage(socket, CommHandler.packData(lobby.lobbyID, lobby.game.currentPlayer?.name, RoomHandler.listToArr(lobby.connections)), "loadGame", true, lobby, connection, io);
        })

        socket.on('startGame', (clientPackage) => {
            let data = JSON.parse(clientPackage);
            let statusCode = data[0];
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);

            if (lobby.game?.hasStarted === false){
                lobby.game.init(io);
            }

        });

        socket.on("chooseWord",(clientPackage) => {
            let data = JSON.parse(clientPackage);
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);
            let word = data[0];
            let game = lobby.game;
            if (game == undefined || game.hasStarted === false) {
                return;
            }

            if(socket.id === game.currentPlayer?.socketID){
                game.currentWord = word;
                game.pauseEnded = true;
            }
        })
    }
}

export let handler = new GameHandler();
