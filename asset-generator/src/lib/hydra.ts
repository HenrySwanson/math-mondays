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

import { Tree } from "./tree";

/* Hydra Structure */

export class HydraSkeleton {
	tree: Tree<null>

	constructor(children: HydraSkeleton[]) {
		this.tree = new Tree(null, children.map(child => child.tree));
	}
}

interface Point { x: number; y: number; }

// The algorithm here is cribbed from: https://llimllib.github.io/pymag-trees/
export class TreeLayout {
	tree: Tree<Point>

	private constructor(x: number, y: number, children: TreeLayout[]) {
		this.tree = new Tree({ x: x, y: y }, children.map(child => child.tree))
	}

	static fromTree<T>(tree: Tree<T>): TreeLayout {
		// If we have no children, we have an easy base case
		if (tree.children.length === 0) {
			return new TreeLayout(0, 0, []);
		}

		// Recursively build the layouts for our children, shifted down
		// by one, and spaced out minimally horizontally.
		let childLayouts = tree.children.map(
			(child, idx) => {
				let layout = TreeLayout.fromTree(child);
				layout.shift(idx, 1);
				return layout;
			}
		);

		// Now, starting with the leftmost child, check for conflicts with
		// its leftward siblings.
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
		let minX = childLayouts[0].tree.payload.x;
		let maxX = childLayouts[childLayouts.length - 1].tree.payload.x;
		let center = (minX + maxX) / 2;
		childLayouts.forEach(child => child.shift(-center, 0));

		return new TreeLayout(0, 0, childLayouts);
	}

	shift(dx: number, dy: number) {
		this.tree.forEachPreorder(t => { t.x += dx; t.y += dy; });
	}

	// The left contour is an array where the ith element is the x-position of the leftmost
	// node on the ith level. Similarly, the right contour is the x-position of the rightmost
	// node on that level.
	_contour(kind: "left" | "right"): number[] {
		// Captured by the function below and modified.
		var contour: number[] = [];

		this.tree.forEachPreorder((node, depth) => {
			let newX = node.x;
			if (depth < contour.length) {
				// Compare ourselves to the existing contour, and update if necessary
				let oldX = contour[depth];
				if (kind == "left" && newX < oldX || kind == "right" && newX > oldX) {
					contour[depth] = newX;
				}
			} else {
				contour.push(newX);
			}
		});

		return contour;
	}

	leftContour(): number[] {
		return this._contour("left");
	}

	rightContour(): number[] {
		return this._contour("right");
	}

	getMinX(): number {
		return Math.min(...this.leftContour());
	}

	getMaxX(): number {
		return Math.max(...this.rightContour());
	}

	getWidth(): number {
		return this.getMaxX() - this.getMinX();
	}
}

export class SvgHeadData {
	head: svgjs.Circle
	neck: svgjs.Line | null

	constructor(group: svgjs.G, neck: boolean) {
		this.head = group.circle(NODE_DIAM);
		if (neck) {
			this.neck = group.line([0, 0, 0, 0]).stroke({ width: NECK_WIDTH });
			this.neck.back();  // put it behind head
		} else {
			this.neck = null;
		}
	}
}

export class SvgHydra {

	svgTree: Tree<SvgHeadData>;
	svgGroup: svgjs.G;

	constructor(drawing: svgjs.Container, skeleton: HydraSkeleton) {
		this.svgGroup = drawing.group();
		this.svgTree = this.createSvgHeads(skeleton.tree);
	}

	createSvgHeads(tree: Tree<null>): Tree<SvgHeadData> {
		return tree.mapX(
			node => new SvgHeadData(this.svgGroup, node.parent !== null)
		);
	}

	repositionNodes(): void {
		let layout = TreeLayout.fromTree(this.svgTree);
		layout.shift(-layout.getMinX(), 0);

		this.svgTree.zip(layout.tree).forEachPreorderX(node => {
			let parent = node.parent;
			let [svgData, position] = node.payload;
			svgData.head.center(position.y * LEVEL_SPACING, position.x * NODE_SPACING);
			if (parent !== null) {
				let parentPosition = parent.payload[1];
				svgData.neck?.plot(
					position.y * LEVEL_SPACING,
					position.x * NODE_SPACING,
					parentPosition.y * LEVEL_SPACING,
					parentPosition.x * NODE_SPACING,
				);
			}
		});
	}

	index(...idxs: number[]): SvgHeadData | null {
		return this.svgTree.index(...idxs)?.payload ?? null;
	}

	root(): SvgHeadData {
		return this.svgTree.payload;
	}
}


// ==================================
// I SHOULD MOVE THE CODE BELOW THIS LINE
// ==================================


export function resizeViewbox(drawing: svgjs.Container, layout: TreeLayout) {
	var boxWidth = 3 * LEVEL_SPACING;
	var boxHeight = layout.getWidth() * NODE_SPACING;

	drawing.viewbox(
		-(H_PADDING + NODE_DIAM / 2),
		-(V_PADDING + NODE_DIAM / 2),
		boxWidth + 2 * H_PADDING + NODE_DIAM,
		boxHeight + 2 * V_PADDING + NODE_DIAM
	);
}

export function setListeners(drawing: svgjs.Container, hydra: SvgHydra, node: Tree<SvgHeadData>, clickCallback: () => void) {

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