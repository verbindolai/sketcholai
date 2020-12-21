let port = 6969;
let socket = io(`http://localhost:${port}`);

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
        draw(x,y);
        console.log("X: " + x)
        console.log("Y: " + y)
    } else {
        oldPosition.x = -1;
        oldPosition.y = -1;
    }

    console.log(drawing)

})

function draw(x, y){

    if(oldPosition.x > 0 && oldPosition.y > 0){
        let color = '#111111'
        drawLine(oldPosition.x,oldPosition.y,x,y,color)
        const pkg = new DrawInfoPackage(x,y,color,lineWidth)
    }
    oldPosition.x = x;
    oldPosition.y = y;
}


socket.on('message', (data)=>{
    let message = JSON.parse(data);
    console.log(message)
})

function sendChatMsg() {
    let chatInput = document.getElementById("chatInput");
    let message = chatInput.value;
    socket.emit('chat', message);
    chatInput.value = "";
    scrollDown();
}

function createNewRoom(){
    console.log("creating new room...")
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
        } else {
            console.log("UPPS")
        }
    }
    xhr.open('get', '/html/lobby.html')
    xhr.send()
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
