let port = 6969;
let socket = io(`http://localhost:${port}`);

let context;
let canvas;
let site;
let WORD_HTML_CONTAINER

/**
 * Events
 * @type {string}
 */
const drawEvent = 'draw';
const fillEvent = 'fill';

/**
 * inits the clients drawing lobby and adds eventlisteners
 */
function init(lobbyID, currentPlayerName) {
    canvas = document.querySelector('#canvas')
    context = canvas.getContext('2d');
    context.lineCap = 'round';
    site = document.querySelector('html');
    timerCont = document.querySelector("#timerContainer");
    CURRENT_PLAYER_NAME_HTML_CONTAINER = document.querySelector("#nameContainer");
    LOBBY_ID_HTML_CONTAINER = document.querySelector("#roomCodeContainer");
    CHAT_HTML_TEXTAREA = document.querySelector("#chatInput");
    highlightedColor = document.querySelector("#btnColBlack");
    highlightedTool = document.querySelector("#btnToolPen");
    highlightedPenSize = document.querySelector("#btnPenNormal");
    connections_html_container = document.querySelector("#connectedPlayerList");
    WORD_HTML_CONTAINER = document.querySelector("#wordContainer");
    CURRENT_WORD_HTML_CONTAINER = document.querySelector("#currentWordContainer");

    highlightTool(highlightedTool);
    highlightColor(highlightedColor);
    highlightPenSize(highlightedPenSize);

    CHAT_HTML_TEXTAREA.onkeydown = function (e) {
        if (e.keyCode == 13) {
            sendChatMsg();
            if(e.preventDefault) {
                e.preventDefault();
            }
        }
    }


    LOBBY_ID_HTML_CONTAINER.innerHTML = lobbyID;
    CURRENT_PLAYER_NAME_HTML_CONTAINER.innerHTML = currentPlayerName;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

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
                bucket.fill(pos.x, pos.y, FILL_BUCKET_TOLERANCE, currentColor, true);
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
            socket.emit(drawEvent, packData(pkg));
            clearOldPosition();
        }
    })

    canvas.addEventListener('mouseout', (event) => {
        if(socket.id !== currentPlayerID){
            return;
        }

        const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
        socket.emit(drawEvent, packData(pkg));
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
                    let pen = new Pen(lineWidth,context, canvas);
                    pen.draw(pos.x, pos.y, currentColor, true);
                    break;
                case toolEnum.ERASER:
                    let eraser = new Eraser(context, canvas);
                    eraser.erase(pos.x, pos.y, true)
                    break;
            }
        }
    })

    //Start listeners
    initGameStateListening();
    initCanvasListening();
    initChatListening();
    initDrawListening();

    socket.emit("isReady", 200);
}

function initUpdatePlayerListListening() {
    socket.on("updatePlayerList", (serverPackage) => {
        const data = JSON.parse(serverPackage);
        const connectionArr = data[0];
        const connectionContainer = document.querySelector("#connectedPlayerList");

        listDisplayer(connectionArr, connectionContainer);
    })
}


/**
 * Receives game information for a new turn
 */
function initGameStateListening() {
    socket.on('updateGameState', (serverPackage) => {  //TODO
        const data = JSON.parse(serverPackage);
        const unixTime = data[0];
        const drawDuration = data[1];
        const name = data[2];
        const id = data[3];
        const gameState = data[4];
        const words = data[5];
        const currentWord = data[6];
        const winner = data[7];
        const allConns = data[8];
        const creatorID = data[9];


        //SWITCH CASE!!!

        if(gameState === 2){
            stopAllListeners()
            if(socket.id === creatorID){
                pageLoad("lobby" ,() => {
                    roomInit()
                    let lobbyRoomCode = document.querySelector("#lobbyRoomCode")
                    lobbyRoomCode.innerHTML = allConns[0]._lobbyID;
                    connections_html_container = document.querySelector("#connectedPlayerList");
                    listDisplayer(allConns, connections_html_container);
                })
                return;
            }

            pageLoad("lobby2" ,() => {
                roomInit()
                let lobbyRoomCode = document.querySelector("#lobbyRoomCode")
                lobbyRoomCode.innerHTML = allConns[0]._lobbyID;
                connections_html_container = document.querySelector("#connectedPlayerList");
                listDisplayer(allConns, connections_html_container);
            })
            return ;
        }

        if (socket.id === id && gameState === 1){
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
           displayWordSuggestions(words)
        }else if (gameState === 1){
            WORD_HTML_CONTAINER.children[0].innerHTML ="";
            WORD_HTML_CONTAINER.classList.add("hidden")
            canvas.classList.remove("hidden");
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        else if(socket.id === id && gameState === 0) {
            WORD_HTML_CONTAINER.children[0].innerHTML ="";
            WORD_HTML_CONTAINER.classList.add("hidden")
            canvas.classList.remove("hidden");
        }

        if (gameState === 4){
            displayPointScreen(allConns);
        }
        currentPlayerID = id;
        currentPlayerName = name;
        if(CURRENT_PLAYER_NAME_HTML_CONTAINER != undefined){
            CURRENT_PLAYER_NAME_HTML_CONTAINER.innerHTML = currentPlayerName;

        }
        CURRENT_WORD_HTML_CONTAINER.innerHTML = currentWord;
        displayTime(drawDuration, unixTime);


    });
}

function displayPointScreen(allConns){
    WORD_HTML_CONTAINER.children[0].innerHTML = "";
    canvas.classList.add("hidden");
    WORD_HTML_CONTAINER.classList.remove("hidden")
    WORD_HTML_CONTAINER.children[0].classList.add("flex","flex-col","justify-center","items-center");

    let winText = document.createElement("div")
    winText.classList.add("text-8xl","text-blue-700" ,"font-bold" ,"mb-4");
    winText.appendChild(document.createTextNode("Round Ended!"))

    let pointsContDiv = document.createElement("div")
    pointsContDiv.classList.add("flex","flex-col","justify-center","items-center")

    for (let conn of allConns){
        let player = conn._player;

        let playerPointsDiv = document.createElement("div")
        playerPointsDiv.classList.add("flex", "flex-row","justify-center","items-center")

        let playerDiv = document.createElement("div");
        playerDiv.appendChild(document.createTextNode(conn._name + ":"))
        playerDiv.classList.add("text-2xl", "font-bold", "mr-2")
        playerDiv.style.color = conn._chatColor;

        let pointsDiv = document.createElement("div");
        pointsDiv.appendChild(document.createTextNode(player._points.toString()))
        pointsDiv.classList.add("text-2xl", "font-bold", "mr-2")
        pointsDiv.style.color = "#24d146";

        playerPointsDiv.append(playerDiv, pointsDiv);
        pointsContDiv.append(playerPointsDiv)
    }
    WORD_HTML_CONTAINER.children[0].append(winText, pointsContDiv)
}

function displayWordSuggestions(words) {
    WORD_HTML_CONTAINER.children[0].innerHTML = "";
    WORD_HTML_CONTAINER.children[0].classList.remove("flex-col")
    canvas.classList.add("hidden");
    WORD_HTML_CONTAINER.classList.remove("hidden")
    for (let i = 0; i < 3; i++){
        let button = document.createElement('button');
        let word = words[i];
        button.classList.add("p-4","bg-yellow-500","text-yellow-700", "rounded" , "mr-2")
        button.appendChild(document.createTextNode(word))
        button.onclick = () => {
            socket.emit("chooseWord", packData(word))
        }
        WORD_HTML_CONTAINER.children[0].appendChild(button)
    }
}


function displayTime(duration, unixTime) {
    clearInterval(timer);

    let realUnix = Math.floor(unixTime / 1000);
    let time = new Date(realUnix * 1000);
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let seconds = time.getSeconds();

    roundTime = duration;
    roundStartTime = realUnix;

    updateTime()
    timer = setInterval(() => {
        updateTime();
    }, 1000);
}

function updateTime() {
    let time = Math.floor(Date.now() / 1000) - roundStartTime;
    timerTime = roundTime - time;
    timerCont.innerHTML = timerTime;
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

function packData(...data){
    return JSON.stringify(data)
}

function stopAllListeners(){
    socket.off('chat');
    socket.off('updateGameState');
    socket.off('updatePlayerList');
    socket.off(drawEvent);
    socket.off(fillEvent);
    socket.off('loadGame');
    socket.off('roomCreated');
    socket.off('roomJoined');
    socket.off('gameJoined')
    socket.off('sendCanvasStatus')
    socket.off('getCanvasStatus')
}
