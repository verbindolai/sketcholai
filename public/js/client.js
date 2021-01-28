let highlightedTool;
let highlightedColor;
let highlightedPenSize;

const highlightPadding = "p-3";
const highlightBorderThickness = "border-4";
const highlightBorderColor = "border-blue-200";

function highlightTool(button){
    highlightedTool.classList.remove(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    button.classList.add(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    highlightedTool = button;
}

function highlightColor(button){
    highlightedColor.classList.remove(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    button.classList.add(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    highlightedColor = button;
}

function highlightPenSize(button){
    highlightedPenSize.classList.remove(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    button.classList.add(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    highlightedPenSize = button;
}

function setLineWidth(width){lineWidth = width}