let port = 6969;
let socket = io(`http://localhost:${port}`);

socket.on('chat', (data) => {
    console.log("got msg")
    document.querySelector("#header").innerHTML = data;
})

function send(ev){
    let chatInput = document.getElementById("chatInput");
    let message = chatInput.value;
    socket.emit(ev, message)
    chatInput.value = "";
}



