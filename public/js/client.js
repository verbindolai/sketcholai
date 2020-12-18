let port = 6969;
let socket = io(`http://localhost:${port}`);
let message = document.getElementById("chatInput").value;

function handle()  {
    socket.on('news', (data) => {
        console.log(`Client received message:\n${data}`)
    })
}

function send(ev){
    socket.emit(ev, message)
}



