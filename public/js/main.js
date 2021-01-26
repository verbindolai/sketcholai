let port = 6969;
let socket = io(`http://localhost:${port}`);

let context;
let canvas;
let site;

/**
 * Events
 * @type {string}
 */
const drawEvent = 'draw';
const fillEvent = 'fill';

/**
 * inits the clients drawing lobby and adds eventlisteners
 */
function init() {
    canvas = document.querySelector('#canvas')
    context = canvas.getContext('2d');
    site = document.querySelector('html');
    timerCont = document.querySelector("#timerContainer");
    nameCont = document.querySelector("#nameContainer");
    displayRoomCode();

    canvas.addEventListener('mousedown', (event) => {

        if(socket.id !== currentPlayerID){
            return;
        }

        switch (currentTool) {
            case toolEnum.PEN:;
            case toolEnum.ERASER:
                drawing = true;
                break;
            case toolEnum.BUCKET:
                const pos = getMousePos(canvas, event);
                let bucket = new Bucket(context, canvas);
                bucket.fill(pos.x, pos.y, 70, currentColor, true);
                break;
        }
    })

    site.addEventListener('mouseup', (event) => {
        if(socket.id !== currentPlayerID){
            return;
        }

        if (currentTool === toolEnum.PEN || currentTool === toolEnum.ERASER) {
            drawing = false;
            const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
            socket.emit(drawEvent, JSON.stringify(pkg));
            clearOldPosition();
        }
    })

    canvas.addEventListener('mouseout', (event) => {
        if(socket.id !== currentPlayerID){
            return;
        }

        const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
        socket.emit(drawEvent, JSON.stringify(pkg));
        clearOldPosition();
    })

    canvas.addEventListener('mousemove', (event) => {
        if(socket.id !== currentPlayerID){
            return;
        }

        if (drawing) {
            const pos = getMousePos(canvas, event);
            switch (currentTool) {
                case toolEnum.PEN:
                    let pen = new Pen(3, context, canvas);
                    pen.draw(pos.x, pos.y, currentColor, true);
                    break;
                case toolEnum.ERASER:
                    let eraser = new Eraser(context, canvas);
                    eraser.erase(pos.x, pos.y, true)
                    break;
            }
        }
    })

}

/**
 * Receives game information for a new turn
 */
socket.on('updateGameState', (args) => {  //TODO
    let data = JSON.parse(args);
    let unixTime = data[0];
    let duration = data[1];
    let name = data[2];
    let id = data[3];

    currentPlayerID = id;
    currentPlayerName = name;

    if(nameCont != undefined){
        nameCont.innerHTML = "Current Player: " + currentPlayerName;
    }
    roundTime = duration;
    clearInterval(timer);
    let realUnix = Math.floor(unixTime / 1000);
    roundStartTime = realUnix;
    let time = new Date(realUnix * 1000);
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let seconds = time.getSeconds();
    timer = setInterval(() => {
        updateTime();
    }, 1000)
    console.log(hours + ":" + minutes + ":" + seconds);
});

function updateTime() {
    let time = Math.floor(Date.now() / 1000) - roundStartTime;
    timerTime = roundTime - time;
    timerCont.innerHTML = "Time: " + timerTime;
    if (timerTime <= 0) {
        timerTime = 0;
        clearInterval(timer);
    }
}

function pageLoad(name, onload) {
    const xhr = new XMLHttpRequest()

    xhr.onload = function () {
        if (this.status === 200) {
            const container = document.body;
            container.innerHTML = xhr.responseText;
            onload();
        } else {
            console.log("UPPS")
        }
    }
    xhr.open('get', `/html/${name}.html`)
    xhr.send()
}

function randomString(length) {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
