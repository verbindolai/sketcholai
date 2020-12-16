import {io, Socket} from "socket.io-client";

/**
 * Represents a Client.
 * @author Christopher Peters, Mathusan Kannathasan, Nikolai Wieczorek
 * @version 1.0
 */
export class Client {

    private socket : Socket;
    private readonly _port : number;

    /**
     * Initialeses the Port and the Client-Socket
     * @param port
     */
    constructor(port : number) {
        this._port = port;
        this.socket = io(`http://localhost:${this._port}`)
    }

    /**
     * Getter for the Port
     */
    public get port() {
        return this._port;
    }

    /**
     * Handles Messages coming from the Server
     */
    public handle() :void {
        this.socket.on('news', (data : any) => {
            console.log(`Client received message:\n${data}`)
        })
    }

    /**
     * Sends Message to the server
     */
    public send() : void{
        this.socket.send("Hey, from the Client!")
    }
}
