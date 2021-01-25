"use_strict";

var resetButton = document.getElementById("reset-button");
var clickCounter = document.getElementById("click-counter");
var drawing = SVG("hydra-interactive");  // really an svg.js element

// Keeps track of number of clicks
var numClicks = 0;
function updateCounter() {
	clickCounter.textContent = "Clicks: " + numClicks;
}

// Recreates and redraws the hydra
function resetHydra() {
	// Clear existing state
	drawing.clear();
	numClicks = 0;
	updateCounter();

	// Create the original hydra
	var hydra = new HydraNode(drawing);
	var child = hydra.appendChild();
	var gchild = child.appendChild();
	var ggchild1 = gchild.appendChild();
	var ggchild2 = gchild.appendChild();

	// Then draw it
	computeHydraLayout(hydra);
	drawHydraImmediately(hydra);
	resizeViewbox(drawing, hydra);

	// Lastly, hook up the listeners
	setListeners(hydra, hydra, updateCounter);
}

resetHydra(); // init hydra
resetButton.addEventListener("click", resetHydra);