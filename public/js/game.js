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
    socket.emit("initGame", packData(drawTime, roundNumber))
}
/**
 * loads the game Page and informs the Server that the game can be started.
 */
function initLoadGameListening() {
    socket.on("loadGame", (serverPackage)=>{
        const data = JSON.parse(serverPackage);
        const lobbyID = data[0];
        const currentPlayerName = data[1];
        const allConnectionsArr = data[2];

        pageLoad("game", () => {
            init(lobbyID, currentPlayerName);
            socket.emit("startGame", packData(200))
            listDisplayer(allConnectionsArr,connections_html_container)
        });
    });
}





