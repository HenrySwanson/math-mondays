"use strict";

// Constants
var NODE_DIAM = 0.5;
var NODE_SPACING = 1;
var LEVEL_SPACING = 2;
var NECK_WIDTH = 0.1;

var V_PADDING = 0.7;
var H_PADDING = 0.5;

var DIE_DURATION = 500;
var MOVE_DURATION = 700;
var CLONE_DURATION = 200;

var CLONE_COLOR = "#422aa8";

/* Hydra Structure */

class HydraNode {
	constructor(drawing, parent=null) {
		// SVG canvas and elements to draw on it
		this.drawing = drawing;
		this.svgHead = drawing.circle(NODE_DIAM);
		this.svgNeck = null;

		// Tree structure
		this.parent = parent;
		this.children = [];

		// Positioning information
		this.targetX = null;
		this.targetY = null;
		this.offsetX = null;

		// Stuff to do for non-root nodes
		if (parent !== null) {
			parent.children.push(this);
			this.svgNeck = drawing.line().stroke({width: NECK_WIDTH});
			this.svgNeck.back();  // put it behind head
		}
	}

	isRoot() {
		return (this.parent === null);
	}

	isLeaf() {
		return (this.children.length === 0);
	}

	appendChild() {
		return new HydraNode(this.drawing, this);
	}

	getLeftSiblings() {
		if (this.isRoot()) {
			return [];
		}
		var idx = this.parent.children.indexOf(this);
		return this.parent.children.slice(0, idx);
	}

	clone() {
		if (this.isRoot()) {
			throw "Can't clone root!"
		}

		// Bind drawing outside the lambda (late binding is awful)
		drawing = this.drawing;

		// Make a copy of this and its children. Also set SVG position.
		function copySubtrees(src, dst) {
			dst.targetX = src.targetX;
			dst.targetY = src.targetY;
			dst.offsetX = src.offsetX;
			src.children.forEach(
				child => copySubtrees(child, dst.appendChild())
			);
		}

		// Note that this attaches the copy to the parent, but at the end,
		// not next to the original
		var copy = this.parent.appendChild();
		copySubtrees(this, copy);

		// Put the copy next to the original
		var idx = this.parent.children.indexOf(this);
		this.parent.children.splice(idx, 0, copy);
		this.parent.children.pop();

		return copy;
	}

	die() {
		if (!this.isLeaf()) {
			throw "Only leaves can be killed!";
		}
		if (this.isRoot()) {
			throw "Can't die as root!";
		}
		var idx = this.parent.children.indexOf(this);
		this.parent.children.splice(idx, 1);
		this.svgHead.remove();
		this.svgNeck.remove();
	}
}

function computeHydraLayout(hydra) {
	var minX = Infinity;  // function scope :)

	// We traverse the tree three times.
	firstPass(hydra);
	secondPass(hydra);
	thirdPass(hydra);

	// First, we do a post-order traversal to compute initial guesses for the
	// X positions for the nodes.
	function firstPass(node) {
		// Recursively apply to children
		node.children.forEach(child => firstPass(child));

		// We'll set Y on the second pass, since it's best set as a pre-order
		// traversal.

		// Set X position relative to the parent node. If you're the left-most
		// child, start at zero, otherwise, +1 from previous sibling.
		var siblings = node.getLeftSiblings();
		if (siblings.length !== 0) {
			var prevSibling = siblings[siblings.length - 1];
			node.targetX = prevSibling.targetX + NODE_SPACING;
		} else {
			node.targetX = 0;
		}

		// If we're a parent node, center our children under ourselves
		if (!node.isLeaf()) {
			var firstChild = node.children[0];
			var lastChild = node.children[node.children.length - 1];
			var center = (firstChild.targetX + lastChild.targetX) / 2;
			node.offsetX = node.targetX - center;
		}

		// Check for conflicts with earlier subtrees. Find the right contours of
		// our siblings, and the left contour of ourselves. Confusingly enough,
		// the right contours are physically to the left of the left contour.
		// We iterate in reverse so we consider the closest siblings first.
		var leftContour = findContour(node, Math.min);
		for (var idx = siblings.length - 1; idx >= 0; idx--) {
			// Grab the sibling and its contour
			var sibling = siblings[idx];
			var rightContour = findContour(sibling, Math.max);
			
			// Find the minimum gap (maybe negative) between the contours
			var gap = NODE_SPACING;
			var contourLength = Math.min(rightContour.length, leftContour.length);
			for (var i = 0; i < contourLength; i++) {
				gap = Math.min(gap, leftContour[i] - rightContour[i]);
			}

			// If the gap is big enough, we're done with this sibling
			if (gap >= NODE_SPACING) {
				continue;
			}
			
			// Otherwise, we'll have to move ourselves a total of
			// (NODE_SPACING - gap) away. But we distribute it across all
			// the siblings between us.
			var numGaps = siblings.length - idx;
			var totalShift = (NODE_SPACING - gap);

			// Move our siblings
			for (var i = 1; i < numGaps; i++) {
				siblings[idx + i].targetX += totalShift * i / numGaps;
				siblings[idx + i].offsetX += totalShift * i / numGaps;
			}
			
			// Move ourselves, and also update our contour
			node.targetX += totalShift;
			node.offsetX += totalShift;
			leftContour = leftContour.map(x => x + totalShift);
		}
	}

	// Second, we do a pre-order traversal to correct our guesses, and to set
	// Y positions. We also take this opportunity to find the leftmost node.
	function secondPass(node, totalOffset=0) {

		// Set Y position
		if (! node.isRoot()) {
			node.targetY = node.parent.targetY + LEVEL_SPACING;
		} else {
			node.targetY = 0;
		}

		// Apply the offset
		node.targetX += totalOffset;
		minX = Math.min(minX, node.targetX);

		// Tack on our offset, and recursively apply to children
		totalOffset += node.offsetX;
		node.children.forEach(child => secondPass(child, totalOffset));
	}

	// Lastly, we do another post-order traversal to shift everything back into
	// the positive quadrant of the plane
	function thirdPass(node) {
		node.targetX -= minX;
		node.children.forEach(child => thirdPass(child));
	}

	function findContour(node, cmp) {
		// This variable has a scope outside the helper function :)
		var contour = [];

		// Evaluates a node and its children, affecting the `contour` variable
		function helper(node, cmp, totalOffset, depth) {
			// Update the contour with ourselves
			var realX = node.targetX + totalOffset;
			if (depth < contour.length) {
				contour[depth] = cmp(contour[depth], realX);
			} else {
				contour.push(realX);
			}

			// Update the contour with our children
			totalOffset += node.offsetX;
			node.children.forEach(
				child => helper(child, cmp, totalOffset, depth + 1)
			);
		}

		// Run helper on the node
		helper(node, cmp, 0, 0);
		return contour;
	}
}

function getHydraWidth(hydra) {
	// Leftmost node is zero, so we just get the largest x, which isn't
	// necessarily the rightmost child
	var xValues = hydra.children.map(child => getHydraWidth(child));
	return xValues.reduce((a, b) => Math.max(a, b), hydra.targetX);
}

/* Animation */

function moveHydraHead(node, head) {
	// Can be applied to the SVG node or its animation
	return head.center(node.targetY, node.targetX);
}

function moveHydraNeck(node, neck) {
	// Can be applied to the SVG node or its animation
	return neck.plot(
		node.targetY, node.targetX, node.parent.targetY, node.parent.targetX
	);
}

function animateHydra(node, duration, ease, head_fn, neck_fn) {
	// Apply animations recursively to a hydra
	node.children.forEach(
		child => animateHydra(child, duration, ease, head_fn, neck_fn)
	);

	if (!node.isRoot()) {
		neck_fn(node, node.svgNeck.animate(duration, ease, 0));
	}
	return head_fn(node, node.svgHead.animate(duration, ease, 0));
}

function drawHydraImmediately(node) {
	node.children.forEach(child => drawHydraImmediately(child));
	moveHydraHead(node, node.svgHead);
	if (!node.isRoot()) {
		moveHydraNeck(node, node.svgNeck);
	}
}

function resizeViewbox(drawing, hydra) {
	var treeWidth = getHydraWidth(hydra);
	var boxWidth = 3 * LEVEL_SPACING;
	var boxHeight = treeWidth * NODE_SPACING;

	drawing.viewbox(
		-(H_PADDING + NODE_DIAM/2),
		-(V_PADDING + NODE_DIAM/2),
		boxWidth +  2*H_PADDING + NODE_DIAM,
		boxHeight + 2*V_PADDING + NODE_DIAM
	)
}

/* Listeners */

function setListeners(node, hydra, clickCallback) {
	// TODO this is kinda gross; the way we wait is to define a second (third,
	// fourth, ...) callback, and call that after an afterAll(). Can I put
	// together something better?

	// Apply recursively to children
	node.children.forEach(child => setListeners(child, hydra, clickCallback));
	// Assign the click handler
	node.svgHead.click(cut);

	// Data passed between callbacks
	var svgGroup;
	var wasClicked = false;

	// We've got a sequence of animation callbacks
	function cut() {
		// Return immediately if we should ignore the click
		if (node.isRoot() || !node.isLeaf() || wasClicked) {return;}

		// Increment counter
		wasClicked = true;
		numClicks += 1;
		clickCallback();

		// Opacity has to be controlled as a group or else the overlap causes
		// problems. But make sure to kill the group later.
		svgGroup = drawing.group().add(node.svgNeck).add(node.svgHead);
		svgGroup.animate(DIE_DURATION, ">", 0).opacity(0).afterAll(cut2);
	}

	function cut2() {
		svgGroup.remove();
		node.die();

		// Our parent should clone itself, unless it's root
		if (!node.parent.isRoot()) {
			var copy1 = node.parent.clone();
			var copy2 = node.parent.clone();

			setListeners(copy1, hydra, clickCallback);  // important lol
			setListeners(copy2, hydra, clickCallback);

			// Didn't compute layout, so copy will be on top of parent
			drawHydraImmediately(hydra);

			makeBlue(node.parent);
			makeBlue(copy1);
			makeBlue(copy2).afterAll(cut3);
		} else {
			cut3(); // call immediately
		}
	}

	function cut3() {
		// Layout the tree again, and move everything to its final position
		computeHydraLayout(hydra);
		resizeViewbox(
			drawing.animate(MOVE_DURATION, "<", 0),
			hydra
		);

		return animateHydra(
			hydra,
			MOVE_DURATION,
			"<",
			(node, head) => moveHydraHead(node, head.fill("#000")),
			(node, neck) => moveHydraNeck(node, neck.stroke("#000")),
		).afterAll(cut4);
	}

	function cut4() {
		if (hydra.isLeaf()) {
			alert(
				"Wow... I can't believe you actually did it!\n" +
				"Sorry I didn't write anything cool for you yet. " + 
				"Perhaps I'll add something later."
			);
		}
	}

	// helper function
	function makeBlue(node) {
		return animateHydra(
			node,
			CLONE_DURATION,
			"<",
			(node, head) => head.fill(CLONE_COLOR),
			(node, neck) => neck.stroke(CLONE_COLOR),
		);
	}
}

// Fancy business to make this browser and node compatible. Every day I hate JS
// more and more. Just export the stuff I need for making diagrams.
// Taken from: https://caolan.org/posts/writing_for_node_and_the_browser.html
(function(exports){
	exports.NODE_DIAM = NODE_DIAM;
	exports.NODE_SPACING = NODE_SPACING;
	exports.LEVEL_SPACING = LEVEL_SPACING;

	exports.CLONE_COLOR = CLONE_COLOR;

	exports.HydraNode = HydraNode;
	exports.getHydraWidth = getHydraWidth;
	exports.computeHydraLayout = computeHydraLayout;
	exports.drawHydraImmediately = drawHydraImmediately;
}(typeof exports === 'undefined' ? {} : exports));