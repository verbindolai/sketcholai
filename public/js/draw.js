"use strict"

const drawEvent = 'draw';
const fillEvent = 'fill';

const COL_WHITE = '#ffffff';
const COL_BLACK = '#000000';
const COL_RED = '#ff0000';
const COL_GREEN = '#2cb323';
const COL_BLUE = '#1c37b5';
const COL_YELLOW = '#e3cf19';
const ERASER = COL_WHITE;

const toolEnum = {"PEN": 1, "ERASER": 2, "BUCKET": 3};
Object.freeze(toolEnum);


let context;
let canvas;
let site;
let drawing = false;
let lineWidth = 2;
let currentColor = COL_BLACK;
let currentTool = toolEnum.PEN;
let oldPosition = {
    x: -1,
    y: -1
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

function init() {
    canvas = document.querySelector('#canvas')
    context = canvas.getContext('2d');
    site = document.querySelector('html');

    canvas.addEventListener('mousedown', (event) => {
        switch (currentTool) {
            case toolEnum.PEN:
                ;
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
        if (currentTool === toolEnum.PEN || currentTool === toolEnum.ERASER) {
            drawing = false;
            const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
            socket.emit(drawEvent, JSON.stringify(pkg));
            clearOldPosition();
        }
    })

    canvas.addEventListener('mouseout', (event) => {
        const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
        socket.emit(drawEvent, JSON.stringify(pkg));
        clearOldPosition();
    })

    canvas.addEventListener('mousemove', (event) => {
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

function startGame() {
    socket.emit("startGame", JSON.stringify("start"));
    pageLoad('game', ()=>{
        init();
        displayRoomCode()
        timerCont = document.querySelector("#timerContainer");
    })
}

//stackoverflow
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function drawLine(x0, y0, x1, y1, color) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();
}




