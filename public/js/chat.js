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

        let chatListNode = document.createElement("li");
        let chatNameCont = document.createElement("div");
        let chatMsgCont = document.createElement("div");
        chatListNode.classList.add("flex", "flex-row")
        chatNameCont.style.color = color;
        chatNameCont.classList.add("font-bold", "mr-1")
        chatMsgCont.classList.add("font-semibold", "break-all")
        chatNameCont.appendChild(document.createTextNode(name + ":"))
        chatMsgCont.appendChild(document.createTextNode(message))
        chatListNode.append(chatNameCont, chatMsgCont);
        chatListNode.classList.add("px-1","rounded","hover:bg-gray-200")
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

    if(message == "" || message == undefined) {
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
    let chatDisplay = document.querySelector('#chatDisplay ');
    chatDisplay.scrollTop = chatDisplay.scrollHeight - chatDisplay.clientHeight;
}
