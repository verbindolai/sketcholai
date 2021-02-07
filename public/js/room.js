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

        socket.emit("isReady", packData(200));

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

   if (roomID == "" || roomID == undefined){
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
        socket.emit("isReady", packData(200));

    });
})

socket.on("gameJoined", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let allConnections = data[0];
    let lobbyID = data[1];
    let currentPlayerName = data[2];
    let currentPlayerSocketID = data[3];

    pageLoad("game", () => {
        init(lobbyID, currentPlayerName);
        initUpdatePlayerListListening();
        socket.emit("isReady", packData(200));
    });
});

socket.on("becomeLeader", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let leaderID = data[0];
    let allConnections = data[1];
    let lobbyID = data[1];

    if(socket.id === leaderID){
        pageLoad("lobby", () => {
            document.querySelector('#lobbyRoomCode').innerHTML = lobbyID;
            socket.emit("isReady", packData(200));
        });
    }
})

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
        let name = document.createElement("div");
        let points = document.createElement("div")

        name.appendChild(document.createTextNode(con._name));
        name.style.color = con._chatColor;
        points.appendChild(document.createTextNode(con._player._points.toString()))

        name.classList.add("font-bold", "text-lg", "mr-2")
        points.classList.add("font-bold")
        li.classList.add("flex", "flex-row", "justify-center", "items-center")
        li.append(name, points)
        node.appendChild(li);
    }
}





