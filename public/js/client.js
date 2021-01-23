let port = 6969;
let socket = io(`http://localhost:${port}`);
let lobbyID;

socket.on('chat', (data) => {
    let message = JSON.parse(data);
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(message.author._name + ": " + message.msg));
    document.querySelector("#chatList").appendChild(li);
    scrollDown();
})

socket.on(drawEvent,(data)=>{
    const message = JSON.parse(data);
    const msg = JSON.parse(message.msg);
    let x = msg.x;
    let y = msg.y;
    let color = msg.color;
    let width = msg.width;
    let drawing = msg.drawing;
    if (drawing){
        let pen = new Pen(width, context, canvas);
        pen.draw(x,y,color, false);
    } else {
        oldPosition.x = -1;
        oldPosition.y = -1;
    }
})

socket.on(fillEvent,(data)=>{
    const message = JSON.parse(data);
    let bucket = new Bucket(context, canvas);
    bucket.fill(message.msg.x, message.msg.y,128, message.msg.color, false)
})

socket.on('message', (data)=>{
    let message = JSON.parse(data);
})

socket.on("roomID", (id) => {
    lobbyID = id;
})

socket.on("canvasStatus", (data) => {
    if (data){
        const img = canvas.toDataURL();
        socket.emit("canvasStatus", img);
    }
})

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

function createNewRoom(){
    let nameInput = document.querySelector("#nameInput");
    let name = nameInput.value;

    if (name == undefined || name == ""){
        name = randomString(6);
    }
    socket.emit('createNewRoom', name);
    pageLoad();
}

function joinRoom() {
    let nameInput = document.querySelector("#nameInput");
    let roomInput = document.querySelector("#roomInput");
    let name = nameInput.value;
    let roomID = roomInput.value;

    if (name == undefined || name == ""){
        name = randomString(6);
    }
    socket.emit('joinRoom', name, roomID);
    pageLoad();
}


function scrollDown() {
    let chatDisplay = document.querySelector('#chatDisplay ');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;
}

function pageLoad () {
    const xhr = new XMLHttpRequest()
    const container = document.body;

    xhr.onload = function () {
        if (this.status === 200){
            container.innerHTML = xhr.responseText;
            init();
            displayRoomCode()
        } else {
            console.log("UPPS")
        }
    }
    xhr.open('get', '/html/lobby.html')
    xhr.send()
}


function displayRoomCode (){
    let idContainer = document.querySelector("#roomCodeContainer");
    idContainer.innerHTML += lobbyID;
}

function randomString(length) {
    let result           = '';
    let characters       = 'abcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
