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
class TreeLayout {
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

	skeleton: HydraSkeleton;
	// TODO: this should be a tree in its own right, I think
	svg_data_map: Map<Tree<null>, SvgHeadData>;
	svg_group: svgjs.G;

	constructor(drawing: svgjs.Container, skeleton: HydraSkeleton) {
		this.skeleton = skeleton;
		this.svg_group = drawing.group();
		this.svg_data_map = new Map();

		this.createSvgHeads(skeleton.tree, true);
	}

	createSvgHeads(tree: Tree<null>, root: boolean = false): void {
		let that = this;
		tree.forEachPreorderX(
			node => that.svg_data_map.set(node, new SvgHeadData(this.svg_group, node.parent !== null))
		);
	}

	repositionNodes(): void {
		let layout = TreeLayout.fromTree(this.skeleton.tree);
		let minX = Math.min(...layout.leftContour());

		let that = this;
		this.skeleton.tree.zipX(layout.tree).forEachPreorderX(node => {
			let parent = node.parent;
			let [head, layout] = node.payload;
			let svgData = that.svg_data_map.get(head)!;
			let position = layout.payload;
			svgData.head.center(position.y * LEVEL_SPACING, position.x * NODE_SPACING - minX);
			if (parent !== null) {
				let parentPosition = parent.payload[1].payload;
				svgData.neck?.plot(
					position.y * LEVEL_SPACING,
					position.x * NODE_SPACING - minX,
					parentPosition.y * LEVEL_SPACING,
					parentPosition.x * NODE_SPACING - minX,
				);
			}
		});
	}

	index(...idxs: number[]): SvgHeadData | null {
		let x = this.skeleton.tree.index(...idxs);
		if (x === null) {
			return null;
		}

		return this.svg_data_map.get(x)!;
	}

	root(): SvgHeadData {
		return this.svg_data_map.get(this.skeleton.tree)!;
	}
}


// ==================================
// I SHOULD MOVE THE CODE BELOW THIS LINE
// ==================================

function getHydraWidth(hydra: SvgHydra): number {
	let layout = TreeLayout.fromTree(hydra.skeleton.tree);
	let minX = Math.min(...layout.leftContour());
	let maxX = Math.max(...layout.rightContour());
	return maxX - minX;
}

export function resizeViewbox(drawing: svgjs.Container, hydra: SvgHydra) {
	var treeWidth = getHydraWidth(hydra);
	var boxWidth = 3 * LEVEL_SPACING;
	var boxHeight = treeWidth * NODE_SPACING;

	drawing.viewbox(
		-(H_PADDING + NODE_DIAM / 2),
		-(V_PADDING + NODE_DIAM / 2),
		boxWidth + 2 * H_PADDING + NODE_DIAM,
		boxHeight + 2 * V_PADDING + NODE_DIAM
	);
}

export function setListeners(drawing: svgjs.Container, hydra: SvgHydra, head: Tree<null>, clickCallback: () => void) {

	// Data passed between callbacks
	let wasClicked = false;
	let svgHead = hydra.svg_data_map.get(head)!;
	let opacityGroup: svgjs.G;

	// We've got a sequence of animation callbacks
	function cut() {
		// Return immediately if we should ignore the click
		if (head.parent === null || head.children.length !== 0) { return; }

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
		let parent = head.parent!;

		// Delete the head that is killed
		opacityGroup.remove();
		head.remove();
		hydra.svg_data_map.delete(head);

		// Our parent should clone itself, unless it's root
		let grandparent = parent.parent;
		if (grandparent === null) {
			cut3(); // call immediately
			return;
		}

		// Generate some copies of the parent
		var parentIdx = grandparent.children.indexOf(parent);
		let copies = [];
		for(let i = 0; i < 2; i++) {
			let copy = parent.makeCopy();
			grandparent.insertSubtree(parentIdx + 1, copy);
			// Create the SVG data for the new subhydras
			hydra.createSvgHeads(copy);
			// Attach listeners to the new SVG elements
			setListeners(drawing, hydra, copy, clickCallback);
			// Lastly, position the copy on top of the parent
			parent.zipX(copy).forEachPreorder(([node1, node2]) => {
				let data1 = hydra.svg_data_map.get(node1)!;
				let data2 = hydra.svg_data_map.get(node2)!;
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
		let layout = TreeLayout.fromTree(hydra.skeleton.tree);
		let minX = Math.min(...layout.leftContour());

		hydra.skeleton.tree.zipX(layout.tree).forEachPreorderX(node => {
			let head = node.payload[0];
			let position = node.payload[1].payload;
			let svgHead = hydra.svg_data_map.get(head)!;
			let headAnim = svgHead.head.animate(MOVE_DURATION, "<", 0);
			// @ts-ignore
			headAnim.center(position.y * LEVEL_SPACING, position.x * NODE_SPACING - minX).fill("#000");
			if (node.parent !== null) {
				let prevPosition = node.parent.payload[1].payload;
				let neckAnim = svgHead.neck?.animate(MOVE_DURATION, "<", 0);
				// @ts-ignore
				neckAnim.plot(
					position.y * LEVEL_SPACING,
					position.x * NODE_SPACING - minX,
					prevPosition.y * LEVEL_SPACING,
					prevPosition.x * NODE_SPACING - minX
				).stroke("#000");
			}
		});

		resizeViewbox(
			// @ts-ignore
			drawing.animate(MOVE_DURATION, "<", 0),
			hydra
		);

		cut4();
	}

	function cut4() {
		if (hydra.skeleton.tree.children.length === 0) {
			// @ts-ignore
			alert(
				"Wow... I can't believe you actually did it!\n" +
				"Sorry I didn't write anything cool for you yet. " +
				"Perhaps I'll add something later."
			);
		}
	}

	// helper function
	function makeBlue(h: Tree<null>) {
		// Recurse
		h.children.forEach(child => makeBlue(child));

		let svgHead = hydra.svg_data_map.get(h)!;
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
	head.children.forEach(child => setListeners(drawing, hydra, child, clickCallback));
}