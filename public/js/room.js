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
    let currentPlayerSocketID = data[3];

    pageLoad("game", () => {
        init(lobbyID, currentPlayerName);
        initUpdatePlayerListListening();
        listDisplayer(allConnections, connections_html_container);
    });
});

socket.on("becomeLeader", (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let leaderID = data[0];
    let allConnections = data[1];
    let lobbyID = data[2];

    if(socket.id === leaderID){
        pageLoad("lobby", () => {
            document.querySelector('#lobbyRoomCode').innerHTML = lobbyID;
            listDisplayer(allConnections, document.querySelector("#connectedPlayerList"));
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

        // if (con.){
        //     let crown = document.createElement("img")
        //     crown.src = "https://cdn0.iconfinder.com/data/icons/happy-new-year-2031/32/Crown-256.png"
        //     crown.width = 25;
        //     crown.classList.add("mr-1");
        //     li.appendChild(crown)
        // }

        // if (con._player._isDrawing){
        //     let pen = document.createElement("img");
        //     pen.src = "https://cdn1.iconfinder.com/data/icons/education-filled-outline-8/64/Education-Filled_25-256.png"
        //     pen.width = 18;
        //     pen.classList.add("mr-1");
        //     li.appendChild(pen)
        // }

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





