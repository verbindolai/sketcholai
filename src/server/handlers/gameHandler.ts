import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommHandler} from "./commHandler";
import {Game, GameState} from "../game";
import {Connection, ReadyStatus} from "../connection";
import {RoomHandler} from "./roomHandler";
import * as fs from "fs";
const signale = require('signale');

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
        signale.watch(`Start listening for Game events for Socket ${socket.id} ...`)

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

        socket.on("clearCanvas", (clientPackage)=> {
            const data = JSON.parse(clientPackage);

            const connection = allConnections.get(socket.id);
            if(connection == undefined) {
                return;
            }
            const lobby = lobbyHashMap.get(connection.lobbyID)
            if(lobby == undefined) {
                return;
            }
            if (connection.player.isDrawing && !CommHandler.deployMessage(socket, CommHandler.packData(data), "clearCanvas", false, lobby, connection, io)) {
                console.error("Couldn't deploy fill Message.")
            }
        })



        socket.on('initGame', (clientPackage) => {
            signale.info("Heard initGame event.")

            let data = JSON.parse(clientPackage);
            let drawTime = data[0];
            let roundNum = data[1];
            let connection = allConnections.get(socket.id);
            if (connection == undefined){
                signale.error("Cant init Game, connection is undefined.")
                return;
            }

            let lobby = lobbyHashMap.get(connection.lobbyID);
            if (lobby == undefined){
                signale.error("Cant init Game, lobby is undefined.")
                return;
            }


            lobby.game = new Game(lobby.lobbyID, drawTime, roundNum, lobby.connections, this._words, connection.socketID);
            CommHandler.deployMessage(socket, CommHandler.packData(lobby.lobbyID, lobby.game.currentPlayer?.name, RoomHandler.listToArr(lobby.connections)), "loadGame", true, lobby, connection, io);
        })

        socket.on('startGame', (clientPackage) => {
            signale.info("Heard startGame event.")

            let data = JSON.parse(clientPackage);
            let statusCode = data[0];
            let connection = allConnections.get(socket.id);
            let lobby = lobbyHashMap.get(connection.lobbyID);

            //When the Game is started by a player before the page of the drawing player is fully loaded it can lead to errors, i.e. the drawing Player misses the word choosing options.
            //In the current implementation the creator of the game is always the first player drawing, so we would need for him to load the page.
            //This is not finally solving the problem, cause when the creator disconnects or takes very long to connect the game doesnt start at all or very delayed.
            //TODO fix pls

            //Idea: Maybe make first player who sends the start game request (lets call him Dave) the current player so that always the fist who starts the game, is the first one drawing.
            //Cause the currentPlayer gets chosen after the games init method, you could archive that by removing Dave from the list and add him at the first place of the connection list.



            if (lobby.game?.hasStarted === false){
                lobby.connections.remove(connection)
                lobby.connections.addFirst(connection)
                signale.success("Start game request accepted.")
                lobby.game.init(io);
            }

        });

        socket.on("chooseWord",(clientPackage) => {
            signale.info("Heard chooseWord event.")

            let data = JSON.parse(clientPackage);
            let connection = allConnections.get(socket.id);

            if(connection == undefined){
                signale.warn("Cant choose word, connection is undefined.")
                return;
            }

            let lobby = lobbyHashMap.get(connection.lobbyID);

            if(lobby == undefined){
                signale.warn("Cant choose word, lobby is undefined.")
                return;
            }
            let word = data[0];
            let game = lobby.game;

            if (game == undefined || game.hasStarted === false) {
                signale.warn("Cant choose word, game is undefined or has not started yet.")
                return;
            }
            if(socket.id === game.currentPlayer?.socketID){
                game.currentWord = word;
                game.currentPlaceholder =  game.currentWord.replace(/[^- ]/g, "_");
                game.wordPauseEnded = true;
            }
        })

        //Implemented but currently not used.
        socket.on("isReady", (clientPackage)=>{
            signale.info("Heard isReady event.")
            let data = JSON.parse(clientPackage);
            let connection = allConnections.get(socket.id);
            if (connection == undefined){
                return;
            }
            let lobbyID = connection.lobbyID;
            let lobby = lobbyHashMap.get(connection.lobbyID);
            if (lobby == undefined){
                return;
            }
            let game = lobby.game;

            if (data === 200 && connection.readyStatus === ReadyStatus.NOT_READY){
                connection.readyStatus = ReadyStatus.READY;
            }
            if (game != undefined && game.hasStarted){
                signale.info("Connection gave Ready-Notification when Game has already started. Updating gameState for Socket, and requesting canvas.")
                socket.emit("updateGameState", CommHandler.packData(game.turnStartDate, game.roundDurationSec, game.currentPlayer?.name, game.currentPlayer?.socketID, game.currentGameState,[],game.currentPlaceholder))

                if(RoomHandler.lateJoinedPlayers.containsKey(lobbyID)){
                    RoomHandler.lateJoinedPlayers.get(lobbyID).add(socket.id);
                }else{
                    const newSocketIdList = new LinkedList<string>();
                    newSocketIdList.add(socket.id);
                    RoomHandler.lateJoinedPlayers.put(lobbyID,newSocketIdList);
                }
                //Sends a request to all other connections in the room to send the current canvas status to the server
                CommHandler.deployMessage(socket,null, "sendCanvasStatus", false, lobby, connection, io);
            }
        })

    }
}

export let handler = new GameHandler();
