let port = 6969;
let socket = io(`http://localhost:${port}`);
let lobbyID;
let roundStartTime;
let roundTime = 10;
let selectedTime;
let timerTime = roundTime;
let timer;
let timerCont;
let nameCont;
let currentPlayerName;
let currentPlayerID;


socket.on('chat', (data) => {
    let message = JSON.parse(data);
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(message.author._name + ": " + message.msg));
    document.querySelector("#chatList").appendChild(li);
    scrollDown();
})

socket.on(drawEvent, (data) => {
    const message = JSON.parse(data);
    const msg = JSON.parse(message.msg);
    let x = msg.x;
    let y = msg.y;
    let color = msg.color;
    let width = msg.width;
    let drawing = msg.drawing;
    if (drawing) {
        let pen = new Pen(width, context, canvas);
        pen.draw(x, y, color, false);
    } else {
        oldPosition.x = -1;
        oldPosition.y = -1;
    }
})

socket.on(fillEvent, (data) => {
    const message = JSON.parse(data);
    let bucket = new Bucket(context, canvas);
    bucket.fill(message.msg.x, message.msg.y, 70, message.msg.color, false)
})

socket.on('message', (data) => {
    let message = JSON.parse(data);
})

socket.on("roomID", (id) => {
    lobbyID = id;
})

socket.on("canvasStatus", (data) => {
    if (data) {
        const img = canvas.toDataURL();
        socket.emit("canvasStatus", img);
    }
})

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

socket.on("joinedLate", (data) =>{
    let msg = JSON.parse(data);
    let connections = msg[0];
    let lobbyID = msg[1];

    pageLoad("lobbyLate",()=>{
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

function joinGame() {
   socket.emit("")
}


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
socket.on("loadGame", (data)=>{

    let message = JSON.parse(data);
    lobbyID = message.msg;

    pageLoad('game', ()=>{
        init();
        socket.emit("gameLoaded", selectedTime);
    })
})

socket.on("gameStarted", (data) => {

})

socket.on("gameTime", (args) => {  //TODO
    let data = JSON.parse(args);
    let unixTime = data[0];
    let duration = data[1];
    let name = data[2];
    let id = data[3];

    currentPlayerID = id;
    currentPlayerName = name;

    if(nameCont != undefined){
        nameCont.innerHTML = "Current Player: " + currentPlayerName;
    }
    roundTime = duration;
    clearInterval(timer);
    let realUnix = Math.floor(unixTime / 1000);
    roundStartTime = realUnix;
    let time = new Date(realUnix * 1000);
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let seconds = time.getSeconds();
    timer = setInterval(() => {
        updateTime();
    }, 1000)
    console.log(hours + ":" + minutes + ":" + seconds);
});

function updateTime() {
    let time = Math.floor(Date.now() / 1000) - roundStartTime;
    timerTime = roundTime - time;
    timerCont.innerHTML = "Time: " + timerTime;
    if (timerTime <= 0) {
        timerTime = 0;
        clearInterval(timer);
    }
}

socket.on('canvasUpdate', (data) => {
    let message = JSON.parse(data);
    drawDataURIOnCanvas(message.msg)
})

function drawDataURIOnCanvas(strDataURI) {
    let img = new window.Image();
    img.addEventListener("load", function () {
        context.drawImage(img, 0, 0);
    });
    img.setAttribute("src", strDataURI);
}

function sendChatMsg() {
    let chatInput = document.getElementById("chatInput");
    let message = chatInput.value;
    socket.emit('chat', message);
    chatInput.value = "";
    scrollDown();
}

function createNewRoom() {
    let nameInput = document.querySelector("#nameInput");
    let name = nameInput.value;

    if (name == undefined || name == "") {
        name = randomString(6);
    }
    socket.emit('createNewRoom', name);

}

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


function scrollDown() {
    let chatDisplay = document.querySelector('#chatDisplay ');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;
}

function pageLoad(name, onload) {
    const xhr = new XMLHttpRequest()

    xhr.onload = function () {
        if (this.status === 200) {
            const container = document.body;
            container.innerHTML = xhr.responseText;
            onload();
        } else {
            console.log("UPPS")
        }
    }
    xhr.open('get', `/html/${name}.html`)
    xhr.send()
}


function displayRoomCode() {
    let idContainer = document.querySelector("#roomCodeContainer");
    idContainer.innerHTML += lobbyID;
}

function randomString(length) {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


