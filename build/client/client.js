let port = 6969;
let socket = io(`http://localhost:${port}`);

function handle()  {
    socket.on('news', (data) => {
        console.log(`Client received message:\n${data}`)
    })
}

function send(ev , msg){
    socket.emit(ev, msg)
}



