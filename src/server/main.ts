import {SketchServer} from "./server"
import {Game} from "./game";

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

    }
}
Main.main();

