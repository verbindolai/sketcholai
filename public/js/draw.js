"use strict"

let context;
let canvas;
let site;
let drawing = false;
let lineWidth = 2;
const drawEvent = 'draw';

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
    constructor(x,y,color,width, drawing) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.color = color;
        this.drawing = drawing;
    }
}


function init(){
    canvas = document.querySelector('#canvas')
    context = canvas.getContext('2d');
    site = document.querySelector('body');

    canvas.addEventListener('mousedown', (event) => {
        drawing = true;
    })

    site.addEventListener('mouseup', (event) => {
        drawing = false;
        const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
        socket.emit(drawEvent, JSON.stringify(pkg));
        clearOldPosition();

    })

    canvas.addEventListener('mouseout', (event) => {
        const pkg = new DrawInfoPackage(undefined, undefined, undefined, undefined, drawing)
        socket.emit(drawEvent, JSON.stringify(pkg));
        clearOldPosition();
    })

    canvas.addEventListener('mousemove', (event) => {
        if(drawing){
            const pos = getMousePos(canvas,event);
            if(oldPosition.x > 0 && oldPosition.y > 0){
                let color = '#111111'
                drawLine(oldPosition.x,oldPosition.y,pos.x,pos.y,color)
                const pkg = new DrawInfoPackage(pos.x,pos.y,color,lineWidth,drawing)
                socket.emit(drawEvent, JSON.stringify(pkg));
            }
            oldPosition.x = pos.x;
            oldPosition.y = pos.y;
        }
    })
}

function clearOldPosition(){
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

function drawLine(x0, y0, x1, y1, color) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();
}




