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
let CURRENT_WORD_HTML_CONTAINER;


function initGame() {
    let drawTime;
    let roundNumber;

    drawTime = document.querySelector("#drawTimeSelect").value;
    roundNumber = document.querySelector("#roundNumSelect").value;
    let words;
    let customOnly = document.querySelector("#customOnly").checked;
    let standardWordList = document.querySelector("#standardListSelect").value;
    uploadWordList().then((value => {
        words = value.split(/[,\n\r]+/).filter(Boolean);
    })).catch((error) =>{
        //console.error(error);
        words = [];
    }).finally(()=>{
        socket.emit("initGame", packData(drawTime, roundNumber, words, customOnly, standardWordList));
    })
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

            socket.emit("isReady", packData(200))
            socket.emit("startGame", packData(200))
        });
    });
}





