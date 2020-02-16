"use strict";

/* Nonsense for setting up fonts and canvases. */
// Right now we're using svgdom to create the SVG, and node-canvas to render it
// to PNG. Hopefully we can just use the latter.

const fs = require('fs');
const TextToSVG = require('text-to-svg');
const util = require('util');

const hydralib = require("../js/hydra_lib.js");

// Set up a fake DOM with a single SVG element at the root
const window = require('svgdom');
const SVG = require('svg.js')(window)

// Load fonts
const ALTE_DIN = TextToSVG.loadSync("fonts/alte-din-1451-mittelschrift/din1451alt.ttf");

function shrinkCanvas(canvas) {
	// Computes bounding box over all elements in the canvas, and resizes the
	// viewbox to fit it.
	var box = canvas.bbox();

	function merge(element) {
		// Explicitly exclude defs, because they're not really in the doc
		if (element.type == 'defs') {
			return;
		}
		// SVG.js creates an zero-opacity SVG.js for 'parsing'; we want to omit
		// this from our calculations
		if (element.type === "svg" && element.style("opacity") === "0") {
			return;
		}
		if (element instanceof SVG.Shape && element.visible()) {
			box = box.merge(element.rbox(canvas));
		}
		if (element instanceof SVG.Container) {
			element.children().forEach(merge);
		}
	}

	merge(canvas);
	canvas.viewbox(box.x, box.y, box.w, box.h);
}

function makeTextPath(canvas, textToSvgObj, text, nfontSize) {
	var originalSize = 72;  // big enough
	var pathData = textToSvgObj.getD(text, {fontSize: originalSize});
	var path = canvas.path(pathData);
	// font size != SVG size, but should be proportional, so we scale down from
	// current size
	path.size(path.width() * nfontSize / originalSize, null); 
	return path;
}

function saveImgToFile(canvas, filename, highlightBackground) {
	if (highlightBackground) {
		var bbox = canvas.viewbox();
		canvas.rect(bbox.width, bbox.height).move(bbox.x, bbox.y).back().fill("#ffff00");
	}

	// clear the parser object (can't delete it or it'll confuse SVG.js)
	SVG.parser.path.instance.attr("d", "");

	fs.writeFileSync(filename, canvas.svg());
}

// Start creating some diagrams!
// This is the actual canvas we want to work on
var canvas = SVG(window.document.documentElement);

// makes hydra creation much easier
function makeHydra(str) {
	// (()())
    var root = new hydralib.HydraNode(canvas);
	var ptr = root;
	for (var i = 0; i < str.length; i++) {
		if (str[i] === "(") {
			ptr = ptr.appendChild();
		} else if (str[i] === ")") {
			ptr = ptr.parent;
		}
	}
	return root;
}

// ---------------------------
// Diagram: Anatomy of a Hydra
// ---------------------------

// make the hydra
var hydra = makeHydra("( () () () ) () (())");
hydralib.computeHydraLayout(hydra);
hydralib.drawHydraImmediately(hydra);

// now place the text
var textColor = "#7c7c7c";
makeTextPath(canvas, ALTE_DIN, "body", 0.75).fill(textColor).move(-3, 0);
makeTextPath(canvas, ALTE_DIN, "heads", 0.75).fill(textColor).move(6, 2);

// and arrows (TODO compute the endpoints?)
var stroke = { color: textColor, width: 0.06, linecap: 'round', linejoin: 'round'};
var marker = canvas.marker(5, 5, function(add) {
  add.polygon("0,0 5,2.5 0,5").fill(textColor);
});

canvas.path("M -2.3,0.9 Q -2.3,2 -0.6,2").stroke(stroke).fill('none').marker('end', marker);

function makeCubicPath(startHeight, endHeight, control1, control2) {
	return util.format(
		"M %f,%f C %f,%f %f,%f %f,%f",
		5.8, startHeight,
		5.8 - control1, startHeight,
		4.6 + control2, endHeight,
		4.6, endHeight
	);
}
// TODO create a path-builder class to make this less nightmarish...
canvas.path(makeCubicPath(2.1, 0, 1, 1)).stroke(stroke).fill('none').marker('end', marker);
canvas.path(makeCubicPath(2.2, 1, 1, 0.7)).stroke(stroke).fill('none').marker('end', marker);
canvas.path(makeCubicPath(2.3, 2, 1, 0.5)).stroke(stroke).fill('none').marker('end', marker);
canvas.path("M 5.8,2.4 C 4.8,2.4 5,2.5 4,2.5 S 3.6,2 2.6,2").stroke(stroke).fill('none').marker('end', marker);
canvas.path(makeCubicPath(2.5, 3, 1, 1)).stroke(stroke).fill('none').marker('end', marker);

// make it the right size
shrinkCanvas(canvas);
saveImgToFile(canvas, "assets/hydra/anatomy.svg");

// ------------------------------
// Diagram: Attacking a Hydra: #1
// ------------------------------

// Put all the hydra definitions in one place
var hydraStrs = [
	"(() ())",
	"(()) (()) (())",
	"(()) () () () (())",
	"(()) (())",
	"(()) () () ()",
	"(())",
	"() () ()",
	"",
]

// A bunch of functions that'll make it easier to generate these very
// similar scenes
function groupHydra(hydra) {
	var group = canvas.group();
	function helper(node) {
		group.add(node.svgHead);
		if (node.svgNeck !== null) {
			group.add(node.svgNeck);
			node.svgNeck.back();  // to avoid overlap with parent
		}
		node.children.forEach(x => helper(x));
	}
	helper(hydra);
	return group;
}

function colorNode(node) {
	var color = hydralib.CLONE_COLOR;
	node.svgHead.fill(color);
	node.svgNeck.stroke(color);
}

function addX(node) {
	var cx = node.svgHead.cx();
	var cy = node.svgHead.cy();
	var size = 0.6;
	var cross = canvas.path(
		util.format(
			"M %f,%f l %f,%f m %f,%f l %f,%f",
			cx + size/2, cy + size/2,
			-size, -size,
			0, size,
			size, -size
		)
	);
	cross.stroke({color: "#bf0000", width: 0.1});
	cross.putIn(node.svgHead.parent());  // use same coordinates as head
}

function setupAttackingExample(startIdx, doThree=false) {
	canvas.clear();

	var spacing = doThree ? 6 : 8;

	// create first hydra
	var hydra1 = makeHydra(hydraStrs[startIdx]);
	hydralib.computeHydraLayout(hydra1);
	hydralib.drawHydraImmediately(hydra1);
	var group1 = groupHydra(hydra1);

	// create second hydra
	var hydra2 = makeHydra(hydraStrs[startIdx + 1]);
	hydralib.computeHydraLayout(hydra2);
	hydralib.drawHydraImmediately(hydra2);
	var group2 = groupHydra(hydra2);

	// align vertically and space horizontally
	group2.dmove(spacing, hydra1.svgHead.y() - hydra2.svgHead.y());

	if (! doThree) {
		return [hydra1, hydra2];
	}

	// create third hydra
	var hydra3 = makeHydra(hydraStrs[startIdx + 2]);
	hydralib.computeHydraLayout(hydra3);
	hydralib.drawHydraImmediately(hydra3);
	var group3 = groupHydra(hydra3);

	// align vertically and space horizontally
	group3.dmove(2 * spacing, hydra1.svgHead.y() - hydra3.svgHead.y());

	return [hydra1, hydra2, hydra3];
}

// setup example
var hydras = setupAttackingExample(0);
var hydraA = hydras[0];
var hydraB = hydras[1];

// add the X
addX(hydraA.children[0].children[1]);

// now do some coloring
colorNode(hydraB.children[0]);
colorNode(hydraB.children[1]);
colorNode(hydraB.children[2]);
colorNode(hydraB.children[0].children[0]);
colorNode(hydraB.children[1].children[0]);
colorNode(hydraB.children[2].children[0]);

// save to disk
shrinkCanvas(canvas);
saveImgToFile(canvas, "assets/hydra/example-1.svg");

// ------------------------------
// Diagram: Attacking a Hydra: #2
// ------------------------------

var hydras = setupAttackingExample(1);
var hydraA = hydras[0];
var hydraB = hydras[1];

addX(hydraA.children[1].children[0]);

colorNode(hydraB.children[1]);
colorNode(hydraB.children[2]);
colorNode(hydraB.children[3]);

shrinkCanvas(canvas);
saveImgToFile(canvas, "assets/hydra/example-2.svg");

// ------------------------------
// Diagram: Attacking a Hydra: #3
// ------------------------------

var hydras = setupAttackingExample(2);
var hydraA = hydras[0];
var hydraB = hydras[1];

addX(hydraA.children[1]);
addX(hydraA.children[2]);
addX(hydraA.children[3]);

// no coloring this time

shrinkCanvas(canvas);
saveImgToFile(canvas, "assets/hydra/example-3.svg");

// ------------------------------
// Diagram: Attacking a Hydra: #4
// ------------------------------

var hydras = setupAttackingExample(3, true);
var hydraA = hydras[0];
var hydraB = hydras[1];
var hydraC = hydras[2];

addX(hydraA.children[1].children[0]);

colorNode(hydraB.children[1]);
colorNode(hydraB.children[2]);
colorNode(hydraB.children[3]);
addX(hydraB.children[1]);
addX(hydraB.children[2]);
addX(hydraB.children[3]);

// no coloring on C

shrinkCanvas(canvas);
saveImgToFile(canvas, "assets/hydra/example-4.svg");

// ------------------------------
// Diagram: Attacking a Hydra: #5
// ------------------------------

var hydras = setupAttackingExample(5, true);
var hydraA = hydras[0];
var hydraB = hydras[1];
var hydraC = hydras[2];

addX(hydraA.children[0].children[0]);

colorNode(hydraB.children[0]);
colorNode(hydraB.children[1]);
colorNode(hydraB.children[2]);
addX(hydraB.children[0]);
addX(hydraB.children[1]);
addX(hydraB.children[2]);

// no coloring on C

// TODO draw dead face
var groupC = hydraC.svgHead.parent();
var stroke = {color: "#ffffff", width: 0.025};
var lefteye = groupC.path("M -1,-1 L 1,1 M 1,-1 L -1,1")
	.size(0.1).stroke(stroke).center(-0.1, -0.06);
var rightEye = lefteye.clone().cx(0.1);
var mouth = groupC.path("M -1,1 A 1.2,1.2 0 0,1 1,1").size(0.27)
	.stroke(stroke).fill("none").center(0, 0.1);

// don't shrink canvas, so we have the same size as before
saveImgToFile(canvas, "assets/hydra/example-5.svg");