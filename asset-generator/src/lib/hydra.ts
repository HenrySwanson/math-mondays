"use strict";

import * as SVG from "@svgdotjs/svg.js";

// Constants
export const NODE_DIAM = 0.5;
export const NODE_SPACING = 1;
export const LEVEL_SPACING = 2;
export const NECK_WIDTH = 0.1;
export const CLONE_COLOR = "#422aa8";

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
	head: SVG.Circle
	neck: SVG.Line | null

	constructor(group: SVG.G, neck: boolean) {
		this.head = group.circle(NODE_DIAM);
		if (neck) {
			this.neck = group.line([0, 0, 0, 0]).stroke({ color: "#000000", width: NECK_WIDTH });
			this.neck.back();  // put it behind head
		} else {
			this.neck = null;
		}
	}
}

export class SvgHydra {

	svgTree: Tree<SvgHeadData>;
	svgGroup: SVG.G;

	constructor(drawing: SVG.Container, skeleton: HydraSkeleton) {
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