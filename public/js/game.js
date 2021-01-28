let roundStartTime;
let roundTime = 10;
let selectedTime;
let timerTime = roundTime;
let timer;
let timerCont;
let CURRENT_PLAYER_NAME_HTML_CONTAINER;
let currentPlayerName;
let currentPlayerID;
let clientName;
let LOBBY_ID_HTML_CONTAINER



function initGame() {
    let drawTime;
    let roundNumber;

    drawTime = document.querySelector("#drawTimeSelect").value;
    roundNumber = document.querySelector("#roundNumSelect").value;


    socket.emit("initGame", packData(10, roundNumber))//TODO drawTime!
}
/**
 * loads the game Page and informs the Server that the game can be started.
 */
socket.on("loadGame", (serverPackage)=>{
    const data = JSON.parse(serverPackage);
    const lobbyID = data[0];
    const currentPlayerName = data[0];

    pageLoad("game", () => {
        init(lobbyID, currentPlayerName);
        socket.emit("startGame", packData(200))
    });
});




