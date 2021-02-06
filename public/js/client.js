let highlightedTool;
let highlightedColor;
let highlightedPenSize;

const highlightPadding = "p-3";
const highlightBorderThickness = "border-2";
const highlightBorderColor = "border-white";

function highlightTool(button){
    highlightedTool.classList.remove("bg-black" ,"bg-opacity-30")
    button.classList.add("bg-black" ,"bg-opacity-30")
    highlightedTool = button;
}

function highlightColor(button){
    highlightedColor.classList.remove(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    button.classList.add(highlightPadding, highlightBorderThickness ,highlightBorderColor)
    highlightedColor = button;
}

function highlightPenSize(button){
    highlightedPenSize.classList.remove(highlightBorderThickness ,highlightBorderColor)
    button.classList.add(highlightBorderThickness ,highlightBorderColor)
    highlightedPenSize = button;
}

function setLineWidth(width){lineWidth = width}
