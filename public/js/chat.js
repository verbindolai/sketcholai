let CHAT_HTML_TEXTAREA;


/**
 * creates a new chat message in chat on channel "chat"
 */
function initChatListening(){
    socket.on('chat', (serverPackage) => {
        let data = JSON.parse(serverPackage);
        let message = data[0];
        let name = data[1];
        let color = data[2];
        let serverMSG = data[3];


        let chatListNode = document.createElement("li");
        chatListNode.classList.add("flex", "flex-row","px-1","rounded","hover:bg-blue-700")


        let chatMsgCont = document.createElement("div");
        chatMsgCont.classList.add("font-semibold", "break-all");

        if (serverMSG === false) {
            let chatNameCont = document.createElement("div");
            chatNameCont.style.color = color;
            chatNameCont.classList.add("font-bold", "mr-1");
            chatNameCont.appendChild(document.createTextNode(name + ":"));
            chatMsgCont.appendChild(document.createTextNode(message))
            chatListNode.append(chatNameCont);
        } else if (serverMSG === true) {
            chatMsgCont.appendChild(document.createTextNode(name + message));
            chatMsgCont.style.color = color;
        }
        chatListNode.append(chatMsgCont);
        console.log(chatListNode)
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
