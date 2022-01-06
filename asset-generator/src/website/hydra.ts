"use_strict";

import type { Tree } from "../lib/tree";
import { HydraSkeleton, TreeLayout, SvgHeadData, SvgHydra, LEVEL_SPACING, NODE_SPACING, NODE_DIAM, NECK_WIDTH, CLONE_COLOR } from "../lib/hydra";

var V_PADDING = 0.7;
var H_PADDING = 0.5;

var DIE_DURATION = 500;
var MOVE_DURATION = 700;
var CLONE_DURATION = 200;

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
	var svgHydra = new SvgHydra(drawing, hydra);
	svgHydra.repositionNodes();
	resizeViewbox(drawing, TreeLayout.fromTree(svgHydra.svgTree));

	// Lastly, hook up the listeners
	setListeners(drawing, svgHydra, svgHydra.svgTree, updateCounter);
}

function resizeViewbox(drawing: svgjs.Container, layout: TreeLayout) {
	var boxWidth = 3 * LEVEL_SPACING;
	var boxHeight = layout.getWidth() * NODE_SPACING;

	drawing.viewbox(
		-(H_PADDING + NODE_DIAM / 2),
		-(V_PADDING + NODE_DIAM / 2),
		boxWidth + 2 * H_PADDING + NODE_DIAM,
		boxHeight + 2 * V_PADDING + NODE_DIAM
	);
}

function setListeners(drawing: svgjs.Container, hydra: SvgHydra, node: Tree<SvgHeadData>, clickCallback: () => void) {

	// Data passed between callbacks
	let wasClicked = false;
	let opacityGroup: svgjs.G;
	let svgHead = node.payload;

	// We've got a sequence of animation callbacks
	function cut() {
		// Return immediately if we should ignore the click
		if (node.parent === null || node.children.length !== 0) { return; }

		// Increment counter
		wasClicked = true;
		clickCallback();

		// Opacity has to be controlled as a group or else the overlap causes
		// problems. But make sure to kill the group later.
		opacityGroup = drawing.group().add(svgHead.neck!).add(svgHead.head);
		// @ts-ignore
		opacityGroup.animate(DIE_DURATION, ">", 0).opacity(0).afterAll(cut2);
	}

	function cut2() {
		let parent = node.parent!;

		// Delete the head that is killed
		opacityGroup.remove();
		node.remove();

		// Our parent should clone itself, unless it's root
		let grandparent = parent.parent;
		if (grandparent === null) {
			cut3(); // call immediately
			return;
		}

		// Generate the new uncles and cousins
		var parentIdx = grandparent.children.indexOf(parent);
		let copies = [];
		for (let i = 0; i < 2; i++) {
			// Make a copy of the parent (nulling out the payloads),
			// and use it to create new svg data.
			// TODO: since that tree doesn't have a parent yet, I have to
			// manually create the line. That seems dumb.
			let copy = hydra.createSvgHeads(parent.map(_ => null));
			copy.payload.neck = hydra.svgGroup.line([0, 0, 0, 0]).stroke({ width: NECK_WIDTH });

			grandparent.insertSubtree(parentIdx + 1, copy);
			// Attach listeners to the new SVG elements
			setListeners(drawing, hydra, copy, clickCallback);
			// Lastly, position the copy on top of the parent
			parent.zip(copy).forEachPreorder(([data1, data2]) => {
				data2.head.move(data1.head.x(), data1.head.y());
				data2.neck?.plot(data1.neck!.array());
			});
			copies.push(copy);
		}

		// Lastly, make everyone involved blue.
		copies.forEach(copy => makeBlue(copy));
		// @ts-ignore
		makeBlue(parent).afterAll(cut3);
	}

	function cut3() {
		// Layout the tree again, and move everything to its final position
		let layout = TreeLayout.fromTree(hydra.svgTree);
		layout.shift(-layout.getMinX(), 0);

		hydra.svgTree.zip(layout.tree).forEachPreorderX(node => {
			let svgHead = node.payload[0];
			let position = node.payload[1];
			let headAnim = svgHead.head.animate(MOVE_DURATION, "<", 0);
			// @ts-ignore
			headAnim.center(position.y * LEVEL_SPACING, position.x * NODE_SPACING).fill("#000");
			if (node.parent !== null) {
				let prevPosition = node.parent.payload[1];
				let neckAnim = svgHead.neck?.animate(MOVE_DURATION, "<", 0);
				// @ts-ignore
				neckAnim.plot(
					position.y * LEVEL_SPACING,
					position.x * NODE_SPACING,
					prevPosition.y * LEVEL_SPACING,
					prevPosition.x * NODE_SPACING
				).stroke("#000");
			}
		});

		resizeViewbox(
			// @ts-ignore
			drawing.animate(MOVE_DURATION, "<", 0),
			layout,
		);

		cut4();
	}

	function cut4() {
		if (hydra.svgTree.children.length === 0) {
			alert(
				"Wow... I can't believe you actually did it!\n" +
				"Sorry I didn't write anything cool for you yet. " +
				"Perhaps I'll add something later."
			);
		}
	}

	// helper function
	// this needs to do the recursion manually for now, so that we return the final animation
	// and use it for afterAll callbacks
	function makeBlue(h: Tree<SvgHeadData>) {
		// Recurse
		h.children.forEach(child => makeBlue(child));

		let svgHead = h.payload;
		if (svgHead.neck !== null) {
			// @ts-ignore
			svgHead.neck.animate(CLONE_DURATION, "<", 0).stroke(CLONE_COLOR);
		}
		// @ts-ignore
		return svgHead.head.animate(CLONE_DURATION, "<", 0).fill(CLONE_COLOR);
	}

	// Finally, now that everything's defined, assign the click handler
	// to self, and recurse to children.
	svgHead.head.click(cut);
	node.children.forEach(child => setListeners(drawing, hydra, child, clickCallback));
}

resetHydra(); // init hydra
resetButton.addEventListener("click", resetHydra);