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

/**
 * loads the game Page and informs the Server that the game can be started.
 */
socket.on("loadGame", (data)=>{

    let message = JSON.parse(data);
    lobbyID = message.msg[0];
    let socketID = message.msg[1]
    console.log("From server: " + socketID)
    console.log("client: "+ socket.id)
    pageLoad('game', ()=>{
        init();
        if(socket.id == socketID){ //TODO
            socket.emit("gameLoaded", selectedTime);
        }
    })
})

socket.on("gameStarted", (data) => {

})

/**
 * Joins a game directly. Used when the game has already started and the client joins late.
 */
function joinGame() {
    socket.emit("lateJoinGame")
}

function startGameInit() {
    socket.emit( "startGameInit", JSON.stringify("start"));
    selectedTime = document.querySelector("#drawTimeSelect").value;
}

