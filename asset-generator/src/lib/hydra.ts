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

	index(...idxs: number[]): HydraSkeleton | null {
		if (idxs.length === 0) {
			return this;
		}

		let i = idxs[0];
		if (i < this.children.length) {
			return this.children[i].index(...idxs.slice(1));
		} else {
			return null;
		}
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
	svg_data_map: Map<HydraSkeleton, SvgHeadData>;
	svg_group: svgjs.G;

	constructor(drawing: svgjs.Container, skeleton: HydraSkeleton) {
		this.skeleton = skeleton;
		this.svg_group = drawing.group();
		this.svg_data_map = new Map();

		this.createSvgHead(skeleton, true);
	}

	createSvgHead(h: HydraSkeleton, root: boolean = false): void {
		// TODO: just create a forEach function on the HydraSkeleton itself.
		// Also a zip()
		this.svg_data_map.set(h, new SvgHeadData(this.svg_group, !root));
		h.children.forEach(child => this.createSvgHead(child, false));
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

	index(...idxs: number[]): SvgHeadData | null {
		let x = this.skeleton.index(...idxs);
		if (x === null) {
			return null;
		}

		return this.svg_data_map.get(x)!;
	}

	root(): SvgHeadData {
		return this.svg_data_map.get(this.skeleton)!;
	}
}


// ==================================
// I SHOULD MOVE THE CODE BELOW THIS LINE
// ==================================

function getHydraWidth(hydra: SvgHydra): number {
	let layout = HydraLayout.fromHydra(hydra.skeleton);
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

export function setListeners(drawing: svgjs.Container, hydra: SvgHydra, head: HydraSkeleton, clickCallback: () => void) {

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

		opacityGroup.remove();
		head.die();
		hydra.svg_data_map.delete(head);

		// Our parent should clone itself, unless it's root
		if (parent.parent === null) {
			cut3(); // call immediately
		}

		// Generate new skeleta, and add them to the svghydra
		// TODO: these should not be separate operations
		var newUncles = parent.generate_siblings(2);
		newUncles.forEach(uncle => hydra.createSvgHead(uncle));

		// Similarly, attach the listeners to each head
		newUncles.forEach(
			uncle => setListeners(drawing, hydra, uncle, clickCallback)
		);

		// Then, we want to place the copy on top of the parent
		// TODO: again, improved by zip
		function setPosition(h: HydraSkeleton, h2: HydraSkeleton) {
			let original = hydra.svg_data_map.get(h)!;
			let copy = hydra.svg_data_map.get(h2)!;
			copy.head.move(original.head.x(), original.head.y());
			copy.neck!.plot(original.neck!.array());
			h.children.forEach((child, idx) => setPosition(child, h2.children[idx]));
		}
		newUncles.forEach(uncle => setPosition(parent, uncle));

		// Lastly, make everyone involved blue.
		newUncles.forEach(uncle => makeBlue(uncle));
		// @ts-ignore
		makeBlue(parent).afterAll(cut3);
	}

	function cut3() {
		// Layout the tree again, and move everything to its final position
		let layout = HydraLayout.fromHydra(hydra.skeleton);
		let minX = Math.min(...layout.leftContour());

		function moveToFinalPosition(h: HydraSkeleton, layout: HydraLayout, prev_layout: HydraLayout | null) {
			let svgHead = hydra.svg_data_map.get(h)!;
			let headAnim = svgHead.head.animate(MOVE_DURATION, "<", 0);
			// @ts-ignore
			headAnim.center(layout.y * LEVEL_SPACING, layout.x * NODE_SPACING - minX).fill("#000");
			if (prev_layout !== null) {
				let neckAnim = svgHead.neck?.animate(MOVE_DURATION, "<", 0);
				// @ts-ignore
				neckAnim.plot(
					layout.y * LEVEL_SPACING,
					layout.x * NODE_SPACING - minX,
					prev_layout.y * LEVEL_SPACING,
					prev_layout.x * NODE_SPACING - minX
				).stroke("#000");
			}
			for (let i = 0; i < h.children.length; i++) {
				moveToFinalPosition(h.children[i], layout.children[i], layout);
			}
		}
		moveToFinalPosition(hydra.skeleton, layout, null);

		resizeViewbox(
			// @ts-ignore
			drawing.animate(MOVE_DURATION, "<", 0),
			hydra
		);

		cut4();
	}

	function cut4() {
		if (hydra.skeleton.children.length === 0) {
			// @ts-ignore
			alert(
				"Wow... I can't believe you actually did it!\n" +
				"Sorry I didn't write anything cool for you yet. " +
				"Perhaps I'll add something later."
			);
		}
	}

	// helper function
	function makeBlue(h: HydraSkeleton) {
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