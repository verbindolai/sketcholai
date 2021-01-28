let globalLobbyID;
let connections_html_container;


function roomInit(){
    connections_html_container = document.querySelector("#connectedPlayerList");
    initLoadGameListening();
    initUpdatePlayerListListening();
}



/**
 * Sends the given player name on the 'createNewRoom' channel to create a new room
 */
function createRoom() {
    let nameInput = document.querySelector("#nameInput");
    let name = nameInput.value;

    if (name == undefined || name == "") {
        name = randomString(6);
    }
    socket.emit('createRoom', packData(name));
}

/**
 * client creates a new Lobby
 */
socket.on("roomCreated", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let connections = data[0];
    let lobbyID = data[1];

    pageLoad("lobby", () => {
        roomInit();
        let lobbyRoomCode = document.querySelector("#lobbyRoomCode")

        lobbyRoomCode.innerHTML = lobbyID;

        listDisplayer(connections, connections_html_container)

    });
})

/**
 *
 */
function joinGame() {
    let nameInput = document.querySelector("#nameInput");
    let roomInput = document.querySelector("#roomInput");
    let name = nameInput.value;
    let roomID = roomInput.value;

    if (name == undefined || name == "") {
        name = randomString(6);
    } else if (roomID == "" || roomID == undefined){
        console.error("Wrong Lobby-ID.")
        return;
    }
    socket.emit('joinGame', packData(name, roomID));
}

/**
 * client joined a Lobby before the Game started.
 * joining Lobby.
 */
socket.on("roomJoined", (serverPackage) =>{
    let data = JSON.parse(serverPackage);
    let connections = data[0];
    let lobbyID = data[1];

    pageLoad("lobby2",()=>{
        roomInit();
        let lobbyRoomCode = document.querySelector("#lobbyRoomCode")
        lobbyRoomCode.innerHTML = lobbyID;

        listDisplayer(connections, connections_html_container);

    });
})

socket.on("gameJoined", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let allConnections = data[0];
    let lobbyID = data[1];
    let currentPlayerName = data[2];
    let unixTime = data[3];
    let drawDuration = data[4];
    let currentPlayerSocketID = data[5];

    pageLoad("game", () => {
        init(lobbyID, currentPlayerName);
        displayTime(drawDuration, unixTime);
        initUpdatePlayerListListening();
        listDisplayer(allConnections, connections_html_container);
        //TODO
    });
});

function initCanvasListening(){
    socket.on("sendCanvasStatus", (serverPackage) => {
        const img = canvas.toDataURL();
        socket.emit("receiveCanvas", packData(img));
    })

    socket.on("getCanvasStatus", (serverPackage) => {
        let data = JSON.parse(serverPackage);
        let imgData = data[0];
        drawDataURIOnCanvas(imgData)
    })
}

function listDisplayer(list, node) {

    node.innerHTML = "";

    for(let con of list) {
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(con._name));
        node.appendChild(li);
    }


}


function sendReady () {

}





