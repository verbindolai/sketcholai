import {SketchServer} from "./server"
import {Client} from "./Client"

/**
 * Entrypoint
 * @author Christopher Peters, Mathusan Kannathasan, Nikolai Wieczorek
 * @version 1.0
 */
class Main {

    /**
     * Starts the Server
     */
    public static main () : void{
        let Server : SketchServer = new SketchServer(6969);
        Server.start();

        let client : Client = new Client(Server.port);
        client.send()
        client.handle()
        client.send()
    }
}
Main.main();

