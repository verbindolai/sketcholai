let port = 6969;
let socket = io(`http://localhost:${port}`);

socket.on('chat', (data) => {
    let message = JSON.parse(data);
    message.author._name
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(message.author._name + ": " + message.msg));
    document.querySelector("#chatList").appendChild(li);
    scrollDown();
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
    let name = 1;
    socket.emit('createNewRoom', name)
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
        } else {
            console.log("UPPS")
        }
    }
    xhr.open('get', '/html/lobby.html')
    xhr.send()
}
