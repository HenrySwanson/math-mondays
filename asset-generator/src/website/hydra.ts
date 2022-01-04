"use_strict";

import { resizeViewbox, setListeners, HydraSkeleton, SvgHydra } from "../lib/hydra";

var resetButton = document.getElementById("reset-button")!;
var clickCounter = document.getElementById("click-counter")!;

// @ts-ignore
var drawing = SVG("hydra-interactive");  // really an svg.js element

// Keeps track of number of clicks
var numClicks = 0;
function updateCounter() {
	clickCounter.textContent = "Clicks: " + numClicks;
	numClicks += 1;
}

// Recreates and redraws the hydra
function resetHydra() {
	// Clear existing state
	drawing.clear();
	numClicks = 0;
	updateCounter();

	// Create the original hydra
	var hydra = new HydraSkeleton([]);
	var child = hydra.tree.appendChild(null);
	var gchild = child.appendChild(null);
	gchild.appendChild(null);
	gchild.appendChild(null);
	
	// Then draw it
	var svg_hydra = new SvgHydra(drawing, hydra);
	svg_hydra.repositionNodes();
	resizeViewbox(drawing, svg_hydra);

	// Lastly, hook up the listeners
	setListeners(drawing, svg_hydra, svg_hydra.svgTree, updateCounter);
}

resetHydra(); // init hydra
resetButton.addEventListener("click", resetHydra);