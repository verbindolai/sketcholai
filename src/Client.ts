import {io} from "socket.io-client";

export class Client {
    socket = io('http://localhost:6969')

    handle() :void {
        this.socket.on('news', (data : any) => {
            console.log(`Client received message:\n${data}`)
        })
    }
    send() : void{
        this.socket.send("Hallo")
    }
}
