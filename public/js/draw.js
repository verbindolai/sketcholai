"use strict"

let drawing = false;
let lineWidth = 2;
const toolEnum = {"PEN": 1, "ERASER": 2, "BUCKET": 3};
Object.freeze(toolEnum);

const COL_WHITE = '#ffffff';
const COL_BLACK = '#000000';
const COL_RED = '#ff0000';
const COL_GREEN = '#2cb323';
const COL_BLUE = '#1c37b5';
const COL_YELLOW = '#e3cf19';
const ERASER = COL_WHITE;

let currentColor = COL_BLACK;
let currentTool = toolEnum.PEN;

let oldPosition = {
    x: -1,
    y: -1
}

class Tool {
    context;
    canvas;

    constructor(context, canvas) {
        this.canvas = canvas;
        this.context = context;
    }
}

class Pen extends Tool {

    lineWidth;

    constructor(lineWidth, context, canvas) {
        super(context, canvas);
        this.lineWidth = lineWidth;
    }

    drawLine(x0, y0, x1, y1, color) {
        this.context.beginPath();
        this.context.moveTo(x0, y0);
        this.context.lineTo(x1, y1);
        this.context.strokeStyle = color;
        this.context.lineWidth = this.lineWidth;
        this.context.stroke();
        this.context.closePath();
    }

    draw(x, y, color, send) {
        if (oldPosition.x > 0 && oldPosition.y > 0) {
            this.drawLine(oldPosition.x, oldPosition.y, x, y, color)
            if (send) {
                const pkg = new DrawInfoPackage(x, y, color, this.lineWidth, drawing)
                socket.emit(drawEvent, JSON.stringify(pkg));
            }
        }
        oldPosition.x = x;
        oldPosition.y = y;
    }
}

class Bucket extends Tool {

    constructor(context, canvas) {
        super(context, canvas);
    }

    fill(x, y, tol, color, send) {
        this.context.fillStyle = color;
        this.context.fillFlood(x, y, tol);
        if (send) {
            socket.emit(fillEvent, new DrawInfoPackage(x, y, currentColor, undefined));
        }
    }
}

class Eraser extends Pen {

    constructor(context, canvas) {
        super(10, context, canvas);
    }

    erase(x, y, send) {
        super.draw(x, y, "#ffffff", send)
    }
}

class DrawInfoPackage {
    x;
    y;
    width;
    color;
    drawing;

    constructor(x, y, color, width, drawing) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.color = color;
        this.drawing = drawing;
    }
}
// <================================ Listener ================================>

socket.on(drawEvent, (data) => {
    const message = JSON.parse(data);
    const msg = JSON.parse(message.msg);
    let x = msg.x;
    let y = msg.y;
    let color = msg.color;
    let width = msg.width;
    let drawing = msg.drawing;
    if (drawing) {
        let pen = new Pen(width, context, canvas);
        pen.draw(x, y, color, false);
    } else {
        oldPosition.x = -1;
        oldPosition.y = -1;
    }
})

socket.on(fillEvent, (data) => {
    const message = JSON.parse(data);
    let bucket = new Bucket(context, canvas);
    bucket.fill(message.msg.x, message.msg.y, 70, message.msg.color, false)
})

socket.on("canvasStatus", (data) => {
    if (data) {
        const img = canvas.toDataURL();
        socket.emit("canvasStatus", img);
    }
})

socket.on('canvasUpdate', (data) => {
    let message = JSON.parse(data);
    drawDataURIOnCanvas(message.msg)
})

// <============================================================================>


function switchTool(tool) {
    switch (tool) {
        case "PEN":
            currentTool = toolEnum.PEN;
            break;
        case "BUCKET" :
            currentTool = toolEnum.BUCKET;
            break;
        case "ERASER" :
            currentTool = toolEnum.ERASER;
            break;
    }
}

function changeColor(button) {
    currentColor = button.value;
}

function clearOldPosition() {
    oldPosition.x = -1;
    oldPosition.y = -1;
}

//stackoverflow
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function drawDataURIOnCanvas(strDataURI) {
    let img = new window.Image();
    img.addEventListener("load", function () {
        context.drawImage(img, 0, 0);
    });
    img.setAttribute("src", strDataURI);
}


