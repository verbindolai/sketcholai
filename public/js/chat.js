
/**
 * creates a new chat message in chat on channel "chat"
 */
socket.on('chat', (data) => {
    let message = JSON.parse(data);
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(message.author._name + ": " + message.msg));
    document.querySelector("#chatList").appendChild(li);
    scrollDown();
})

/**
 * sends the value of the chatInput on channel "chat"
 */
function sendChatMsg() {
    let chatInput = document.getElementById("chatInput");
    let message = chatInput.value;
    socket.emit('chat', message);
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
