let CHAT_HTML_TEXTAREA;


/**
 * creates a new chat message in chat on channel "chat"
 */
function initChatListening(){

    socket.on('chat', (serverPackage) => {
        let data = JSON.parse(serverPackage);
        let message = data[0];
        let conn = data[1];
        let name;
        if(conn == undefined || conn == null){
            name = "";
        }else {
            name = conn._name;
        }
        let color = data[2];
        let serverMSG = data[3];
        let chatType = data[4];

        let roles = conn._roles;

        let chatListNode = document.createElement("li");
        chatListNode.classList.add("flex", "flex-row","px-1","rounded","hover:bg-white", "hover:bg-opacity-20")

        let chatMsgCont = document.createElement("div");
        chatMsgCont.classList.add("font-semibold");

        if (serverMSG === 1) {
            for (let role of roles){
                let roleImg = document.createElement("img");
                roleImg.src = role;
                roleImg.width = 20;
                chatListNode.appendChild(roleImg);
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
        scrollDown();
    })
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



/**
 * scrolls down the chat
 */
function scrollDown() {
    let chatDisplay = document.querySelector('#chatDisplay .simplebar-content-wrapper');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;


}
