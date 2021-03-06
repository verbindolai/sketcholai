import {HandlerInterface} from "./handlerInterface";
import {Server as SocketServer, Socket} from "socket.io";
import {HashMap, LinkedList} from "typescriptcollectionsframework";
import {GameLobby} from "../gameLobby";
import {CommHandler} from "./commHandler";
import {Game, GameState} from "../game";
import {Connection, ReadyStatus} from "../connection";
import {RoomHandler} from "./roomHandler";
import * as fs from "fs";

import {signale} from "../server";

export class GameHandler implements HandlerInterface {

    private readonly drawEvent: string = "draw";
    private readonly fillEvent: string = "fill";
    private _words : string[][] = [];

    init(){
        let rawData = fs.readFileSync("./src/server/handlers/words.txt","utf8");
        this._words[0] = rawData.split("\n");
        rawData = fs.readFileSync("./src/server/handlers/words_en.txt","utf8");
        this._words[1] = rawData.split("\n");
        rawData = fs.readFileSync("./src/server/handlers/words_lol.txt","utf8");
        this._words[2] = rawData.split("\n");
        // this.jsonToTxt();
    }

    // private jsonToTxt(){
    //     let rawData = fs.readFileSync("./src/server/handlers/words_en.json","utf8")//.substr(1);
    //     const list = JSON.parse(rawData);
    //     for(let word of list){
    //         fs.appendFileSync("./src/server/handlers/words_en.txt",word + "\n");
    //     }
    //     console.log("feddich");
    // }

    handle(socket: Socket, lobbyHashMap: HashMap<string, GameLobby>, io: SocketServer, allConnections : HashMap<string, Connection>) {
        signale.watch(`Start listening for Game events for Socket ${socket.id} ...`)

        socket.on(this.drawEvent, (clientPackage) => {
            try{
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
            }catch (e) {
                signale.error(e);
            }
        })

        socket.on(this.fillEvent, (clientPackage) => {
            try{
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
                    signale.error("Couldn't deploy fill Message.")
                }
            }catch (e) {
                signale.error(e);
            }
        })

        socket.on("clearCanvas", (clientPackage)=> {
            try{
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
                    signale.error("Couldn't deploy fill Message.")
                }
            }catch (e) {
                signale.error(e);
            }
        })

        socket.on('initGame', (clientPackage) => {
            signale.info("Heard initGame event.")
            try{
                if(Buffer.byteLength(clientPackage, 'utf8') > 40000){
                    signale.error(new Error("clientPackage too big!"));
                    return;
                }
                let data = JSON.parse(clientPackage);
                let drawTime = data[0];
                let roundNum = data[1];
                let connection = allConnections.get(socket.id);
                const words : string[] = data[2];
                let customOnly = data[3];
                let wordListIndex = data[4];

                //Englisch wordlist if out of bounds
                if(wordListIndex >= this._words.length){
                    wordListIndex = 1;
                }
                if (connection == undefined){
                    signale.error("Cant init Game, connection is undefined.")
                    return;
                }

                let lobby = lobbyHashMap.get(connection.lobbyID);
                if (lobby == undefined){
                    signale.error("Cant init Game, lobby is undefined.")
                    return;
                }

                if(words.length === 0 && customOnly){
                    customOnly = false;
                }

                lobby.game = new Game(lobby.lobbyID, drawTime, roundNum, lobby.connections, this._words[wordListIndex], lobby.leaderID, words,customOnly);
                CommHandler.deployMessage(socket, CommHandler.packData(lobby.lobbyID, lobby.game.currentPlayer?.name, RoomHandler.listToArr(lobby.connections)), "loadGame", true, lobby, connection, io);
            }catch (e) {
                signale.error(e);
            }
        })

        socket.on('startGame', (clientPackage) => {
            signale.info("Heard startGame event.")
            try{
                let data = JSON.parse(clientPackage);
                let statusCode = data[0];
                let connection = allConnections.get(socket.id);
                let lobby = lobbyHashMap.get(connection.lobbyID);

                if (lobby.game?.hasStarted === false){
                    lobby.connections.remove(connection)
                    lobby.connections.addFirst(connection)
                    signale.success("Start game request accepted.")
                    lobby.game.init(io);
                }
            }catch (e) {
               signale.error(e);
            }
        });

        socket.on("chooseWord",(clientPackage) => {
            signale.info("Heard chooseWord event.")
            try{
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
            }catch(e){
                signale.error(e);
            }
        })

        socket.on("isReady", (clientPackage)=>{
            signale.info("Heard isReady event.")
            try{
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

                    let date = game.turnStartDate;
                    let dur = game.ROUND_DURATION_SEC;
                    if (game.currentGameState == GameState.WORD_PAUSE){
                        date = game.wordPauseStartDate
                        dur = game.WORD_PAUSE_DURATION_SEC;
                    } else if (game.currentGameState == GameState.ROUND_PAUSE){
                        date = game.roundPauseStartDate;
                        dur = game.ROUND_PAUSE_DURATION_SEC;
                    }

                    socket.emit("updateGameState", CommHandler.packData(date, dur, game.currentPlayer?.name, game.currentPlayer?.socketID, game.currentGameState,[],game.currentPlaceholder))

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
            }catch (e) {
                signale.error(e);
            }
        });

    }
}

export let handler = new GameHandler();
