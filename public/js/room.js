let lobbyID;

/**
 * client creates a new Lobby
 */
socket.on("created", (data) => {
    let msg = JSON.parse(data);
    let connections = msg[0];
    let lobbyID = msg[1];

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
 * client joined a Lobby before the Game started.
 * joining Lobby.
 */
socket.on("joined", (data) =>{
    let msg = JSON.parse(data);
    let connections = msg[0];
    let lobbyID = msg[1];

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

/**
 * client joining after the Game has started.
 * joining directly to the Game.
 */
socket.on("joinStartedGame", () => {

    let msg = JSON.parse(data);
    let connections = msg[0];
    let lobbyID = msg[1];

    pageLoad("game", () => {
        init();

    })
})

/**
 * a new player joins the lobby
 * updates the player list of all clients who are currently in the lobby
 */
socket.on("newPlayerJoined", (data) => {
    let message = JSON.parse(data);
    let msg = JSON.parse(message.msg)
    let connections = msg[0];
    let connectionContainer = document.querySelector("#connectedPlayerList");
    connectionContainer.innerHTML = "";

    for(let con of connections) {
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(con._name));
        connectionContainer.appendChild(li);
    }
})

/**
 * Receives the id for the room where the player joined
 */
socket.on("roomID", (id) => {
    lobbyID = id;
})

/**
 * Sends the given player name on the 'createNewRoom' channel to create a new room
 */
function createNewRoom() {
    let nameInput = document.querySelector("#nameInput");
    let name = nameInput.value;

    if (name == undefined || name == "") {
        name = randomString(6);
    }
    socket.emit('createNewRoom', name);

}

/**
 * Joins a Room by its ID, sends the given Playername to the server
 */
function joinRoom() {
    let nameInput = document.querySelector("#nameInput");
    let roomInput = document.querySelector("#roomInput");
    let name = nameInput.value;
    let roomID = roomInput.value;

    if (name == undefined || name == "") {
        name = randomString(6);
    }
    socket.emit('joinRoom', name, roomID);
}

function displayRoomCode() {
    let idContainer = document.querySelector("#roomCodeContainer");
    idContainer.innerHTML += lobbyID;
}
