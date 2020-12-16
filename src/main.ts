import {SketchServer} from "./server"
import {Client} from "./Client"

let Server : SketchServer = new SketchServer(6969);
Server.start();

let client : Client = new Client();
client.send()
client.handle()
client.send()
