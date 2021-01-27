let CHAT_HTML_TEXTAREA;

/**
 * creates a new chat message in chat on channel "chat"
 */
socket.on('chat', (serverPackage) => {
    let data = JSON.parse(serverPackage);
    let message = data[0];
    let name = data[1];

    let li = document.createElement("li");
    li.appendChild(document.createTextNode(name + ": " + message));
    document.querySelector("#chatList").appendChild(li);
    scrollDown();
})

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
