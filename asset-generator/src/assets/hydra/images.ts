"use strict";

// Import our utils library and initialize mathjax+svg
import asset_utils = require("../../builder/utils");
import { Builder } from "../../builder/builder";

// Import other libraries
import util = require('util');
import { CLONE_COLOR, HydraSkeleton, SvgHydra, SvgHeadData } from "./lib";
import * as SVG from "@svgdotjs/svg.js"

const ALTE_DIN = asset_utils.loadFont("alte-din-1451-mittelschrift/din1451alt.ttf");

// makes hydra creation much easier
function makeHydraSkeleton(str: string): HydraSkeleton {
	// (()())
	var root = new HydraSkeleton([]);
	var ptr = root.tree;
	for (var i = 0; i < str.length; i++) {
		if (str[i] === "(") {
			ptr = ptr.appendChild(null);
		} else if (str[i] === ")") {
			ptr = ptr.parent!;
		}
	}
	return root;
}

// Start creating some diagrams!
export let builder = new Builder("hydra");

// ---------------------------
// Diagram: Anatomy of a Hydra
// ---------------------------
builder.register("anatomy.svg", function (canvas) {
	// make the hydra
	var hydra = makeHydraSkeleton("( () () () ) () (())");
	var svg_hydra = new SvgHydra(canvas, hydra);
	svg_hydra.repositionNodes();

	// now place the text
	var textColor = "#7c7c7c";
	asset_utils.makeTextPath(canvas, ALTE_DIN, "body", 0.75).fill(textColor).move(-3, 0);
	asset_utils.makeTextPath(canvas, ALTE_DIN, "heads", 0.75).fill(textColor).move(6, 2);

	// and arrows (TODO compute the endpoints?)
	var stroke: SVG.StrokeData = { color: textColor, width: 0.06, linecap: 'round', linejoin: 'round' };
	var marker = canvas.marker(5, 5, function (add: SVG.Marker) {
		add.polygon("0,0 5,2.5 0,5").fill(textColor);
	});

	canvas.path("M -2.3,0.8 Q -2.3,2 -0.6,2").stroke(stroke).fill('none').marker('end', marker);

	function makeCubicPath(startHeight: number, endHeight: number, control1: number, control2: number) {
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
	asset_utils.shrinkCanvas(canvas);
});

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

function colorNode(node: SvgHeadData) {
	var color = CLONE_COLOR;
	node.head.fill(color);
	node.neck?.stroke(color);
}

function drawRedX(canvas: SVG.Container, node: SvgHeadData) {
	var cx = node.head.cx();
	var cy = node.head.cy();
	var size = 0.6;
	var cross = canvas.path(
		util.format(
			"M %f,%f l %f,%f m %f,%f l %f,%f",
			cx + size / 2, cy + size / 2,
			-size, -size,
			0, size,
			size, -size
		)
	);
	cross.stroke({ color: "#bf0000", width: 0.1 });
	cross.putIn(node.head.parent()!);  // use same coordinates as head
}

function setupAttackingExample(canvas: SVG.Container, startIdx: number, doThree: boolean = false): SvgHydra[] {
	var spacing = doThree ? 6 : 8;

	// create first hydra
	let hydra1 = new SvgHydra(canvas, makeHydraSkeleton(hydraStrs[startIdx]));
	hydra1.repositionNodes();

	// create second hydra
	let hydra2 = new SvgHydra(canvas, makeHydraSkeleton(hydraStrs[startIdx + 1]));
	hydra2.repositionNodes();

	// align vertically and space horizontally
	hydra2.svgGroup.translate(spacing, hydra1.root().head.cy() - hydra2.root().head.cy());

	if (!doThree) {
		return [hydra1, hydra2];
	}

	// create third hydra
	let hydra3 = new SvgHydra(canvas, makeHydraSkeleton(hydraStrs[startIdx + 2]));
	hydra3.repositionNodes();

	// align vertically and space horizontally
	hydra3.svgGroup.translate(2 * spacing, hydra1.root().head.cy() - hydra3.root().head.cy());

	return [hydra1, hydra2, hydra3];
}

// setup example
builder.register("example-1.svg", function (canvas) {
	var hydras = setupAttackingExample(canvas, 0);
	var hydraA = hydras[0];
	var hydraB = hydras[1];

	// add the x over the head
	drawRedX(canvas, hydraA.index(0, 1)!);

	// now do some coloring
	colorNode(hydraB.index(0)!);
	colorNode(hydraB.index(1)!);
	colorNode(hydraB.index(2)!);
	colorNode(hydraB.index(0, 0)!);
	colorNode(hydraB.index(1, 0)!);
	colorNode(hydraB.index(2, 0)!);

	// save to disk
	asset_utils.shrinkCanvas(canvas);
});

// ------------------------------
// Diagram: Attacking a Hydra: #2
// ------------------------------
builder.register("example-2.svg", function (canvas) {
	var hydras = setupAttackingExample(canvas, 1);
	var hydraA = hydras[0];
	var hydraB = hydras[1];

	drawRedX(canvas, hydraA.index(1, 0)!);
	colorNode(hydraB.index(1)!);
	colorNode(hydraB.index(2)!);
	colorNode(hydraB.index(3)!);

	asset_utils.shrinkCanvas(canvas);
});

// ------------------------------
// Diagram: Attacking a Hydra: #3
// ------------------------------
builder.register("example-3.svg", function (canvas) {
	var hydras = setupAttackingExample(canvas, 2);
	var hydraA = hydras[0];
	var hydraB = hydras[1];

	drawRedX(canvas, hydraA.index(1)!);
	drawRedX(canvas, hydraA.index(2)!);
	drawRedX(canvas, hydraA.index(3)!);

	// no coloring this time

	asset_utils.shrinkCanvas(canvas);
});

// ------------------------------
// Diagram: Attacking a Hydra: #4
// ------------------------------
builder.register("example-4.svg", function (canvas) {
	var hydras = setupAttackingExample(canvas, 3, true);
	var hydraA = hydras[0];
	var hydraB = hydras[1];
	var hydraC = hydras[2];

	drawRedX(canvas, hydraA.index(1, 0)!);

	colorNode(hydraB.index(1)!);
	colorNode(hydraB.index(2)!);
	colorNode(hydraB.index(3)!);
	drawRedX(canvas, hydraB.index(1)!);
	drawRedX(canvas, hydraB.index(2)!);
	drawRedX(canvas, hydraB.index(3)!);

	// no coloring on C

	asset_utils.shrinkCanvas(canvas);
});

// ------------------------------
// Diagram: Attacking a Hydra: #5
// ------------------------------
builder.register("example-5.svg", function (canvas) {
	var hydras = setupAttackingExample(canvas, 5, true);
	var hydraA = hydras[0];
	var hydraB = hydras[1];
	var hydraC = hydras[2];

	drawRedX(canvas, hydraA.index(0, 0)!);

	colorNode(hydraB.index(0)!);
	colorNode(hydraB.index(1)!);
	colorNode(hydraB.index(2)!);
	drawRedX(canvas, hydraB.index(0)!);
	drawRedX(canvas, hydraB.index(1)!);
	drawRedX(canvas, hydraB.index(2)!);

	// no coloring on C
	var groupC = hydraC.root().head.parent() as SVG.G;
	var stroke: SVG.StrokeData = { color: "#ffffff", width: 0.025 };
	var lefteye = groupC.path("M -1,-1 L 1,1 M 1,-1 L -1,1")
		.size(0.1).stroke(stroke).center(-0.1, -0.06);
	var rightEye = lefteye.clone().addTo(groupC).cx(0.1);
	var mouth = groupC.path("M -1,1 A 1.2,1.2 0 0,1 1,1").size(0.27)
		.stroke(stroke).fill("none").center(0, 0.1);

	// don't shrink canvas, so we have the same size as before
});


//------------------------------------------------
// Diagram: Ordinal sequence for killing the hydra
//------------------------------------------------
builder.register("ordinals.svg", function (canvas) {
	var values = [
		"\\omega^2", "3 \\omega", "2 \\omega + 3", "2 \\omega",
		"\\omega + 3", "\\omega", "3", "0",
	];
	for (var i = 0; i < 8; i++) {
		// Where's the UL corner of our cell?
		var cellX = (i % 4) * 8;
		var cellY = (i < 4) ? 0 : 8;

		// Make the hydra
		var h = new SvgHydra(canvas, makeHydraSkeleton(hydraStrs[i]));
		h.repositionNodes();

		// Group the hydra so you can move it.
		h.svgGroup.dy(-h.root().head.y())  // put the root at y=0
		h.svgGroup.dmove(cellX, cellY);  // put into the proper cell

		var value = asset_utils.makeMathSvg(canvas, values[i], 1);
		// put the center of the bottom at the origin
		value.dx(-value.width() / 2);
		value.dmove(cellX + 2, cellY + 4);
	}

	asset_utils.shrinkCanvas(canvas);
});
