let port = 6969;
let socket = io(`http://localhost:${port}`);

socket.on('chat', (data) => {
    console.log("got msg")
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(data))
    document.querySelector("#chatList").appendChild(li);
    let chatDisplay = document.querySelector('#chatDisplay ');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;
})


function send(ev){
    let chatInput = document.getElementById("chatInput");
    let message = chatInput.value;
    socket.emit(ev, message)
    chatInput.value = "";
    let chatDisplay = document.querySelector('#chatDisplay ');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;
}



