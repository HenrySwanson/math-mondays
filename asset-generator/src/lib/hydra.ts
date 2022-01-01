"use strict";

import type { svgjs } from "svg.js";

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

export var CLONE_COLOR = "#422aa8";

/* Hydra Structure */

export class HydraSkeleton {
	parent: HydraSkeleton | null
	children: HydraSkeleton[]

	constructor(children: HydraSkeleton[]) {
		this.parent = null;
		this.children = children;
		children.forEach(child => child.parent = this);
	}

	deepcopy(): HydraSkeleton {
		return new HydraSkeleton(this.children.map(child => child.deepcopy()));
	}

	appendChild(): HydraSkeleton {
		let child = new HydraSkeleton([]);
		child.parent = this;
		this.children.push(child);
		return child;
	}

	die(): void {
		// Leaves shouldn't die according to the rules of the game, but it's
		// not insensible for them to do so.
		// The root however can never die.
		if (this.parent === null) {
			throw "Can't kill root!"
		}

		let idx = this.parent.children.indexOf(this);
		this.parent.children.splice(idx, 1);
	}

	generate_siblings(n: number): HydraSkeleton[] {
		if (this.parent === null) {
			throw "Can't clone root!"
		}

		// Generate some copies of this hydra, and attach them
		// to the parent.
		let copies: HydraSkeleton[] = [];
		for (let i = 0; i < n; i++) {
			let copy = this.deepcopy();
			copy.parent = this.parent;
			copies.push(copy);
		}

		// Insert the copies, and wire them up to the parents
		var idx = this.parent.children.indexOf(this);
		this.parent.children.splice(idx + 1, 0, ...copies);

		return copies;
	}
}

// The algorithm here is cribbed from: https://llimllib.github.io/pymag-trees/
class HydraLayout {
	x: number
	y: number
	children: HydraLayout[]

	private constructor(x: number, y: number, children: HydraLayout[]) {
		this.x = x;
		this.y = y;
		this.children = children;
	}

	static fromHydra(hydra: HydraSkeleton): HydraLayout {
		// If we have no children this is easy
		if (hydra.children.length == 0) {
			return new HydraLayout(0, 0, []);
		}

		// Otherwise, we recursively build this from the original hydra's children
		// Create layouts for each child, and shift them so that they are 1 unit
		// lower, and spaced out minimally horizontally.
		let childLayouts = hydra.children.map(t => HydraLayout.fromHydra(t));
		childLayouts.forEach((child, idx) => child.shift(idx, 1));

		// Now, for each child, check its conflicts with the siblings on its left.
		for (let i = 0; i < childLayouts.length; i++) {
			for (let j = i - 1; j >= 0; j--) {
				let leftContour = childLayouts[i].leftContour();
				let rightContour = childLayouts[j].rightContour();

				// Find the gap between the two contours (possibly negative!).
				let minLength = Math.min(leftContour.length, rightContour.length);
				let idealGap = 1;
				let gap = idealGap;
				for (let k = 0; k < minLength; k++) {
					gap = Math.min(gap, leftContour[k] - rightContour[k]);
				}

				// If it's large enough, continue to the next sibling. Otherwise,
				// adjust our positions, dragging intermediate nodes along with us.
				if (gap >= idealGap) {
					continue;
				}

				// We are #i, the collision is with node #j, so there are 
				// (i - j - 1) nodes in between us, and we also move ourselves,
				// so there's i - j nodes to move.
				let totalShift = idealGap - gap;
				let numGaps = i - j;
				for (let k = 1; k <= numGaps; k++) {
					childLayouts[j + k].shift(totalShift * k / numGaps, 0);
				}
			}
		}

		// Lastly, we center our children under ourselves
		let minX = childLayouts[0].x;
		let maxX = childLayouts[childLayouts.length - 1].x;
		let center = (minX + maxX) / 2;
		childLayouts.forEach(child => child.shift(-center, 0));

		return new HydraLayout(0, 0, childLayouts);
	}

	shift(dx: number, dy: number) {
		this.x += dx;
		this.y += dy;
		this.children.forEach(child => child.shift(dx, dy));
	}

	// The left contour is an array where the ith element is the x-position of the leftmost
	// node on the ith level. Similarly, the right contour is the x-position of the rightmost
	// node on that level.
	_contour(kind: "left" | "right"): number[] {
		var contour: number[] = [];

		// Folds this subtree into the `contour` variable.
		function helper(subtree: HydraLayout, depth: number) {
			// Start with the parent, then recurse to our children. Starting
			// with the parent means that `contour` remains a contiguous
			// array.
			let newX = subtree.x;
			if (depth < contour.length) {
				// Compare ourselves to the existing contour, and update if necessary
				let oldX = contour[depth];
				if (kind == "left" && newX < oldX || kind == "right" && newX > oldX) {
					contour[depth] = newX;
				}
			} else {
				contour.push(newX);
			}

			subtree.children.forEach(child => helper(child, depth + 1));
		}

		// Run helper on all of ourselves
		helper(this, 0);
		return contour;
	}

	leftContour(): number[] {
		return this._contour("left");
	}

	rightContour(): number[] {
		return this._contour("right");
	}

}

class SvgHeadData {
	head: svgjs.Circle
	neck: svgjs.Line | null

	constructor(drawing: svgjs.Container, neck: boolean) {
		this.head = drawing.circle(NODE_DIAM);
		if (neck) {
			this.neck = drawing.line([0, 0, 0, 0]).stroke({ width: NECK_WIDTH });
			this.neck.back();  // put it behind head
		} else {
			this.neck = null;
		}
	}
}

export class SvgHydra {

	skeleton: HydraSkeleton;
	svg_data_map: Map<HydraSkeleton, SvgHeadData>;

	constructor(drawing: svgjs.Container, skeleton: HydraSkeleton) {
		let svg_data_map = new Map();

		// TODO: just create a forEach function on the HydraSkeleton itself.
		// Also a zip()
		function makeSvgData(h: HydraSkeleton, root: boolean): void {
			svg_data_map.set(h, new SvgHeadData(drawing, !root));
			h.children.forEach(child => makeSvgData(child, false));
		}
		makeSvgData(skeleton, true);

		this.skeleton = skeleton;
		this.svg_data_map = svg_data_map;
	}

	repositionNodes(): void {
		let layout = HydraLayout.fromHydra(this.skeleton);
		var minX = Math.min(...layout.leftContour());

		var that = this;
		function apply(hydra: HydraSkeleton, layout: HydraLayout, prev_layout: HydraLayout | null) {
			// TODO clean up this linear transform business
			let svg_data = that.svg_data_map.get(hydra)!;
			svg_data.head.center(layout.y * LEVEL_SPACING, layout.x * NODE_SPACING - minX);
			if (prev_layout !== null) {
				svg_data.neck?.plot(
					layout.y * LEVEL_SPACING,
					layout.x * NODE_SPACING - minX,
					prev_layout.y * LEVEL_SPACING,
					prev_layout.x * NODE_SPACING - minX
				);
			}

			for (let i = 0; i < hydra.children.length; i++) {
				apply(hydra.children[i], layout.children[i], layout);
			}
		}
		apply(this.skeleton, layout, null);
	}
}


// ==================================
// OLD CODE BELOW THIS LINE
// ==================================





export class HydraNode {
	drawing: svgjs.Container
	svgHead: svgjs.Circle
	svgNeck: svgjs.Line | null

	parent: HydraNode | null
	children: HydraNode[]

	targetX: number | null
	targetY: number | null
	offsetX: number | null

	constructor(drawing: svgjs.Container, parent: HydraNode | null = null) {
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
			this.svgNeck = drawing.line([0, 0, 0, 0]).stroke({ width: NECK_WIDTH });
			this.svgNeck.back();  // put it behind head
		}
	}

	isRoot(): boolean {
		return (this.parent === null);
	}

	isLeaf(): boolean {
		return (this.children.length === 0);
	}

	appendChild(): HydraNode {
		return new HydraNode(this.drawing, this);
	}

	getLeftSiblings(): HydraNode[] {
		if (this.isRoot()) {
			return [];
		}
		var idx = this.parent!.children.indexOf(this);
		return this.parent!.children.slice(0, idx);
	}

	clone() {
		if (this.isRoot()) {
			throw "Can't clone root!"
		}

		// Make a copy of this and its children. Also set SVG position.
		function copySubtrees(src: HydraNode, dst: HydraNode) {
			dst.targetX = src.targetX;
			dst.targetY = src.targetY;
			dst.offsetX = src.offsetX;
			src.children.forEach(
				child => copySubtrees(child, dst.appendChild())
			);
		}

		// Note that this attaches the copy to the parent, but at the end,
		// not next to the original
		var copy = this.parent!.appendChild();
		copySubtrees(this, copy);

		// Put the copy next to the original
		var idx = this.parent!.children.indexOf(this);
		this.parent!.children.splice(idx, 0, copy);
		this.parent!.children.pop();

		return copy;
	}

	die(): void {
		if (!this.isLeaf()) {
			throw "Only leaves can be killed!";
		}
		if (this.isRoot()) {
			throw "Can't die as root!";
		}
		var idx = this.parent!.children.indexOf(this);
		this.parent!.children.splice(idx, 1);
		this.svgHead.remove();
		this.svgNeck!.remove();
	}
}

export function computeHydraLayout(hydra: HydraNode): void {
	var minX = Infinity;  // function scope :)

	// We traverse the tree three times.
	firstPass(hydra);
	secondPass(hydra);
	thirdPass(hydra);

	// First, we do a post-order traversal to compute initial guesses for the
	// X positions for the nodes.
	function firstPass(node: HydraNode) {
		// Recursively apply to children
		node.children.forEach(child => firstPass(child));

		// We'll set Y on the second pass, since it's best set as a pre-order
		// traversal.

		// Set X position relative to the parent node. If you're the left-most
		// child, start at zero, otherwise, +1 from previous sibling.
		var siblings = node.getLeftSiblings();
		if (siblings.length !== 0) {
			var prevSibling = siblings[siblings.length - 1];
			node.targetX = prevSibling.targetX! + NODE_SPACING;
		} else {
			node.targetX = 0;
		}

		// If we're a parent node, center our children under ourselves
		if (!node.isLeaf()) {
			var firstChild = node.children[0];
			var lastChild = node.children[node.children.length - 1];
			var center = (firstChild.targetX! + lastChild.targetX!) / 2;
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
				siblings[idx + i].targetX! += totalShift * i / numGaps;
				siblings[idx + i].offsetX! += totalShift * i / numGaps;
			}

			// Move ourselves, and also update our contour
			node.targetX += totalShift;
			node.offsetX! += totalShift;
			leftContour = leftContour.map(x => x + totalShift);
		}
	}

	// Second, we do a pre-order traversal to correct our guesses, and to set
	// Y positions. We also take this opportunity to find the leftmost node.
	function secondPass(node: HydraNode, totalOffset: number = 0) {

		// Set Y position
		if (!node.isRoot()) {
			node.targetY = node.parent!.targetY! + LEVEL_SPACING;
		} else {
			node.targetY = 0;
		}

		// Apply the offset
		node.targetX! += totalOffset;
		minX = Math.min(minX, node.targetX!);

		// Tack on our offset, and recursively apply to children
		totalOffset += node.offsetX!;
		node.children.forEach(child => secondPass(child, totalOffset));
	}

	// Lastly, we do another post-order traversal to shift everything back into
	// the positive quadrant of the plane
	function thirdPass(node: HydraNode) {
		node.targetX! -= minX;
		node.children.forEach(child => thirdPass(child));
	}

	function findContour(node: HydraNode, cmp: (a: number, b: number) => number): number[] {
		// This variable has a scope outside the helper function :)
		var contour: number[] = [];

		// Evaluates a node and its children, affecting the `contour` variable
		function helper(node: HydraNode, cmp: (a: number, b: number) => number, totalOffset: number, depth: number) {
			// Update the contour with ourselves
			var realX = node.targetX! + totalOffset;
			if (depth < contour.length) {
				contour[depth] = cmp(contour[depth], realX);
			} else {
				contour.push(realX);
			}

			// Update the contour with our children
			totalOffset += node.offsetX!;
			node.children.forEach(
				child => helper(child, cmp, totalOffset, depth + 1)
			);
		}

		// Run helper on the node
		helper(node, cmp, 0, 0);
		return contour;
	}
}

function getHydraWidth(hydra: HydraNode): number {
	// Leftmost node is zero, so we just get the largest x, which isn't
	// necessarily the rightmost child
	var xValues = hydra.children.map(child => getHydraWidth(child));
	return xValues.reduce((a, b) => Math.max(a, b), hydra.targetX!);
}

/* Animation */

function moveHydraHead(node: HydraNode, head: svgjs.Circle) {
	// Can be applied to the SVG node or its animation
	return head.center(node.targetY!, node.targetX!);
}

function moveHydraNeck(node: HydraNode, neck: svgjs.Line) {
	// Can be applied to the SVG node or its animation
	return neck.plot(
		node.targetY!, node.targetX!, node.parent!.targetY!, node.parent!.targetX!
	);
}

function animateHydra(node: HydraNode, duration: number, ease: string, head_fn: (h: HydraNode, head: svgjs.Animation) => svgjs.Animation, neck_fn: (h: HydraNode, neck: svgjs.Animation) => svgjs.Animation) {
	// Apply animations recursively to a hydra
	node.children.forEach(
		child => animateHydra(child, duration, ease, head_fn, neck_fn)
	);

	if (!node.isRoot()) {
		neck_fn(node, node.svgNeck!.animate(duration, ease, 0));
	}
	return head_fn(node, node.svgHead.animate(duration, ease, 0));
}

export function drawHydraImmediately(node: HydraNode) {
	node.children.forEach(child => drawHydraImmediately(child));
	moveHydraHead(node, node.svgHead);
	if (!node.isRoot()) {
		moveHydraNeck(node, node.svgNeck!);
	}
}

export function resizeViewbox(drawing: svgjs.Container, hydra: HydraNode) {
	var treeWidth = getHydraWidth(hydra);
	var boxWidth = 3 * LEVEL_SPACING;
	var boxHeight = treeWidth * NODE_SPACING;

	drawing.viewbox(
		-(H_PADDING + NODE_DIAM / 2),
		-(V_PADDING + NODE_DIAM / 2),
		boxWidth + 2 * H_PADDING + NODE_DIAM,
		boxHeight + 2 * V_PADDING + NODE_DIAM
	)
}

/* Listeners */

export function setListeners(node: HydraNode, hydra: HydraNode, clickCallback: () => void) {
	// TODO this is kinda gross; the way we wait is to define a second (third,
	// fourth, ...) callback, and call that after an afterAll(). Can I put
	// together something better?
	var drawing = hydra.drawing;

	// Apply recursively to children
	node.children.forEach(child => setListeners(child, hydra, clickCallback));
	// Assign the click handler
	node.svgHead.click(cut);

	// Data passed between callbacks
	var svgGroup: svgjs.G;
	var wasClicked = false;

	// We've got a sequence of animation callbacks
	function cut() {
		// Return immediately if we should ignore the click
		if (node.isRoot() || !node.isLeaf() || wasClicked) { return; }

		// Increment counter
		wasClicked = true;
		clickCallback();

		// Opacity has to be controlled as a group or else the overlap causes
		// problems. But make sure to kill the group later.
		svgGroup = drawing.group().add(node.svgNeck!).add(node.svgHead);
		// @ts-ignore
		svgGroup.animate(DIE_DURATION, ">", 0).opacity(0).afterAll(cut2);
	}

	function cut2() {
		svgGroup.remove();
		node.die();

		// Our parent should clone itself, unless it's root
		if (!node.parent!.isRoot()) {
			var copy1 = node.parent!.clone();
			var copy2 = node.parent!.clone();

			setListeners(copy1, hydra, clickCallback);  // important lol
			setListeners(copy2, hydra, clickCallback);

			// Didn't compute layout, so copy will be on top of parent
			drawHydraImmediately(hydra);

			makeBlue(node.parent!);
			makeBlue(copy1);
			// @ts-ignore
			makeBlue(copy2).afterAll(cut3);
		} else {
			cut3(); // call immediately
		}
	}

	function cut3() {
		// Layout the tree again, and move everything to its final position
		computeHydraLayout(hydra);
		resizeViewbox(
			// @ts-ignore
			drawing.animate(MOVE_DURATION, "<", 0),
			hydra
		);

		return animateHydra(
			hydra,
			MOVE_DURATION,
			"<",
			// @ts-ignore
			(node, head) => moveHydraHead(node, head.fill("#000")),
			// @ts-ignore
			(node, neck) => moveHydraNeck(node, neck.stroke("#000")),
			// @ts-ignore
		).afterAll(cut4);
	}

	function cut4() {
		if (hydra.isLeaf()) {
			// @ts-ignore
			alert(
				"Wow... I can't believe you actually did it!\n" +
				"Sorry I didn't write anything cool for you yet. " +
				"Perhaps I'll add something later."
			);
		}
	}

	// helper function
	function makeBlue(node: HydraNode) {
		return animateHydra(
			node,
			CLONE_DURATION,
			"<",
			// @ts-ignore
			(node, head) => head.fill(CLONE_COLOR),
			// @ts-ignore
			(node, neck) => neck.stroke(CLONE_COLOR),
		);
	}
}