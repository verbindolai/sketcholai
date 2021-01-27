let roundStartTime;
let roundTime = 10;
let selectedTime;
let timerTime = roundTime;
let timer;
let timerCont;
let nameCont;
let currentPlayerName;
let currentPlayerID;
let clientName;




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
socket.on("loadGame", (serverPackage)=>{

    pageLoad("game", () => {
        init();
        socket.emit("startGame", packData(200))
    });
});




