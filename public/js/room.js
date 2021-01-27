let lobbyID;

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
        let connectionContainer = document.querySelector("#connectedPlayerList");
        let lobbyRoomCode = document.querySelector("#lobbyRoomCode")

        connectionContainer.innerHTML = "";
        lobbyRoomCode.innerHTML = lobbyID;

        for(let con of connections) {
            let li = document.createElement("li");
            li.appendChild(document.createTextNode(con._name));
            connectionContainer.appendChild(li);
        }
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
        let connectionContainer = document.querySelector("#connectedPlayerList");
        let lobbyRoomCode = document.querySelector("#lobbyRoomCode")

        connectionContainer.innerHTML = "";
        lobbyRoomCode.innerHTML = lobbyID;

        for(let con of connections) {
            let li = document.createElement("li");
            li.appendChild(document.createTextNode(con._name));
            connectionContainer.appendChild(li);
        }
    });
})

socket.on("gameJoined", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let lobbyID = data[0];
    let imgURL = data[1];

    pageLoad("game", () => {
        init();
        //TODO
    });
});


socket.on("sendCanvasStatus", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let socketID = data[0];
    console.log("raw: " + serverPackage)
    console.log("Data: " + data);
    console.log(socketID);
    const img = canvas.toDataURL();
    socket.emit("receiveCanvas", packData(socketID, img));
})

socket.on("getCanvasStatus", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let imgData = data[0];
    drawDataURIOnCanvas(imgData)
})

function displayRoomCode() {
    let idContainer = document.querySelector("#roomCodeContainer");
    idContainer.innerHTML += lobbyID;
}


