let CHAT_HTML_TEXTAREA;


/**
 * creates a new chat message in chat on channel "chat"
 */
function initChatListening(){

    socket.on('chat', (serverPackage) => {
        let data = JSON.parse(serverPackage);
        console.log(data);
        let message = data[0];
        let names = data[1];
        if(names === null || names === undefined){
            names = [];
        }

        let color = data[2];
        let serverMSG = data[3];
        let chatType = data[4];
        let roles = data[5];

        displayChatMessage({
            names,
            message,
            roles,
            color,
            serverMSG,
            chatType
        })
        scrollDown();
    })

    socket.on("triggerPointAnimation",(serverPackage) => {
        const data = JSON.parse(serverPackage);
        const points = data[0];
        document.querySelector("#pointNumAnimate").innerHTML = "+"+points;
        triggerPointAnimation();
    })
}

function displayChatMessage({name, message, roles, color, serverMSG, chatType}){
    let chatListNode = document.createElement("li");
    chatListNode.classList.add("flex", "flex-row","px-1","rounded","hover:bg-white", "hover:bg-opacity-20")

    let chatMsgCont = document.createElement("div");
    chatMsgCont.classList.add("font-semibold");

    if (serverMSG === 1) {
        if(roles !== undefined){
            for (let role of roles){
                let roleImg = document.createElement("img");
                roleImg.src = role;
                roleImg.width = 20;
                chatListNode.appendChild(roleImg);
            }
        }
        let chatNameCont = document.createElement("div");
        chatNameCont.style.color = color;
        chatNameCont.classList.add("font-bold", "mr-1");
        chatNameCont.appendChild(document.createTextNode(decodeURI(name) + ":"));
        chatMsgCont.appendChild(document.createTextNode(decodeURI(message)));
        chatListNode.append(chatNameCont);
        if(chatType === 1){
            chatMsgCont.style.color = "#c9892e";
        }
    } else if (serverMSG === 0) {
        chatMsgCont.appendChild(document.createTextNode(decodeURI(name + message)));
        chatMsgCont.classList.add("italic")
        chatMsgCont.style.color = color;
    }
    chatListNode.append(chatMsgCont);
    document.querySelector("#chatList").appendChild(chatListNode);
}



/**
 * sends the value of the chatInput on channel "chat"
 */
function sendChatMsg() {
    let chatInput = document.getElementById("chatInput");
    let message = chatInput.value;

    if (message == "" || undefined || message.replace(/\s/g, '').length == 0) {
        chatInput.value = "";
        return;
    }

    socket.emit('chat', packData(message));
    chatInput.value = "";
    scrollDown();
}

function triggerPointAnimation(){
    let points = document.querySelector("#pointNumAnimate")
    let input = document.querySelector("#chatInput")
    input.classList.add("glowGreen")
    input.style.borderColor = "#22C55E"
    setTimeout(() =>{
        input.style.borderColor = ""
        input.classList.remove("glowGreen")
    }, 500)
    points.style.opacity = 100;
    points.classList.remove("top-4")
    points.classList.add("top-0")
    setTimeout(() => {
        points.style.opacity = 0;
        points.classList.remove("top-0")
        points.classList.add("top-4")
    },350)
}

/**
 * scrolls down the chat
 */
function scrollDown() {
    let chatDisplay = document.querySelector('#chatDisplay .simplebar-content-wrapper');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;
}
