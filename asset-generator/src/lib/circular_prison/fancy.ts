"use strict";

import { IPrisonerState, Announcement, WaxingPhase, WaningPhase } from "./common";

const ACTIVE_COLOR = "#ffff00";
const WANING_COLOR = "#ffcc00";
const INACTIVE_COLOR = "#808080";
const CANDIDATE_COLOR = "#00ffff";
const BORDER_COLOR = "#000000";

const PRISONER_RADIUS = 20;
const PRISONER_SPACING = 80;
const COIN_DIAMETER = 10;
const SWITCH_HEIGHT = 30;
const SWITCH_WIDTH = 15;

export type State = UpperBoundPhase | FlashLightsPhase | RefinePartitionPhase1 | RefinePartitionPhase2 | FinalState;

export function startState(captain: boolean): State {
	return UpperBoundPhase.start(captain);
}


class UpperBoundPhase implements IPrisonerState<State> {
	phase: "upper-bound" = "upper-bound";
	inner: WaxingPhase | WaningPhase;

	constructor(inner: WaxingPhase | WaningPhase) {
		this.inner = inner;
	}

	static start(captain: boolean) {
		return new UpperBoundPhase(new WaxingPhase(captain, 1, 1, captain));
	}

	next(t: boolean): State {
		let x = this.inner.next(t);
		if (!x.done) {
			return new UpperBoundPhase(x.value);
		}

		let context = PartitionContext.createNew(x.value, 2, this.inner.captain ? 1 : 2);
		return new FlashLightsPhase(context);
	}

	willFlip(): boolean {
		return this.inner.active;
	}

	description(): string {
		if (this.inner.phase == "waxing") {
			let limit = this.inner.round;
			return `Upper Bound Phase: Round ${this.inner.round}, Waxing ${this.inner.day}/${limit}`;
		} else {
			let limit = 2 ** this.inner.round;
			return `Upper Bound Phase: Round ${this.inner.round}, Waning ${this.inner.day}/${limit}`;
		}
	}

	commonKnowledge(): string[] {
		return [];
	}
}

// TODO there's gotta be a better way than defining boring constructors
class PartitionContext {
	upperBound: number;
	numPartitions: number;
	myPartition: number;
	enumerationOrder: number[][];
	enumerationPosition: number;
	intersectionHistory: number[][];

	constructor(upperBound: number,
		numPartitions: number,
		myPartition: number,
		enumerationOrder: number[][],
		enumerationPosition: number,
		intersectionHistory: number[][]
	) {
		this.upperBound = upperBound;
		this.numPartitions = numPartitions;
		this.myPartition = myPartition;
		this.enumerationOrder = enumerationOrder;
		this.enumerationPosition = enumerationPosition;
		this.intersectionHistory = intersectionHistory;
	}

	static createNew(upperBound: number, numPartitions: number, myPartition: number): PartitionContext {
		// Create a list of all subsets, except the trivial ones
		let subsets: number[][] = [[]];
		for (let i = 1; i <= numPartitions; i++) {
			// Add subsets with and without the element i
			subsets = subsets.concat(subsets.map(x => x.concat([i])));
		}

		// Drop the first and last element
		subsets = subsets.slice(1, -1);

		return new PartitionContext(
			upperBound,
			numPartitions,
			myPartition,
			subsets,
			0,
			[],
		)
	}

	currentSubset(): number[] {
		return this.enumerationOrder[this.enumerationPosition];
	}

	inCurrentSubset(): boolean {
		return this.currentSubset().includes(this.myPartition);
	}

	bumpIndex(intersection: number[]): PartitionContext | null {
		if (this.enumerationPosition == this.enumerationOrder.length - 1) {
			return null;
		}

		return new PartitionContext(
			this.upperBound, this.numPartitions, this.myPartition, this.enumerationOrder, this.enumerationPosition + 1, this.intersectionHistory.concat([intersection])
		);
	}

	splitIndex(j: number, flashed: boolean): PartitionContext {
		return PartitionContext.createNew(
			this.upperBound,
			this.numPartitions + 1,
			this.myPartition == j && !flashed ? this.numPartitions + 1 : this.myPartition,
		)
	}
}

type PartitionSubcontext = {
	wasFlashed: boolean;
	round: number;
	intersected: number[];
}


class FlashLightsPhase implements IPrisonerState<State> {
	phase: "flash" = "flash";

	context: PartitionContext;

	constructor(context: PartitionContext) {
		this.context = context;
	}

	next(t: boolean): State {
		let subcontext = {
			wasFlashed: t,
			round: 1,
			intersected: [],
		}
		return RefinePartitionPhase1.start(this.context, subcontext);
	}

	willFlip(): boolean {
		return this.context.inCurrentSubset();
	}

	description(): string {
		return `Flash Day: I = {${this.context.currentSubset()}}`;
	}

	commonKnowledge(): string[] {
		let facts = [`N ≤ ${this.context.upperBound}`, `${this.context.numPartitions} partitions`];
		for (let i = 0; i < this.context.enumerationPosition; i++) {
			facts.push(`{${this.context.enumerationOrder[i]}} tagged {${this.context.intersectionHistory[i]}}`);
		}
		return facts;
	}
}


class RefinePartitionPhase1 implements IPrisonerState<State> {
	phase: "refine-1" = "refine-1";

	context: PartitionContext;
	subcontext: PartitionSubcontext;
	announcement: Announcement;

	constructor(context: PartitionContext, subcontext: PartitionSubcontext, announcement: Announcement) {
		this.context = context;
		this.subcontext = subcontext;
		this.announcement = announcement;
	}

	static start(context: PartitionContext, subcontext: PartitionSubcontext): RefinePartitionPhase1 {
		// Announce if you're in S_j and T
		let a = new Announcement(context.myPartition == subcontext.round && subcontext.wasFlashed, context.upperBound, 1);
		return new RefinePartitionPhase1(context, subcontext, a);
	}

	next(t: boolean): State {
		let x = this.announcement.next(t);
		if (!x.done) {
			return new RefinePartitionPhase1(this.context, this.subcontext, x.value);
		}

		// Record whether S_j intersect T was empty or not, and proceed to check S_j minus T
		let wasInhabited = x.value;
		let a = new Announcement(this.context.myPartition == this.subcontext.round && !this.subcontext.wasFlashed, this.context.upperBound, 1);
		return new RefinePartitionPhase2(this.context, this.subcontext, wasInhabited, a);
	}

	willFlip(): boolean {
		return this.announcement.active;
	}

	description(): string {
		return `(I = {${this.context.currentSubset()}}) Announcement: S_${this.subcontext.round} ∩ T? Step ${this.announcement.day}/${this.context.upperBound}`;
	}

	commonKnowledge(): string[] {
		let facts = [`N ≤ ${this.context.upperBound}`, `${this.context.numPartitions} partitions`];
		for (let i = 0; i < this.context.enumerationPosition; i++) {
			facts.push(`{${this.context.enumerationOrder[i]}} tagged {${this.context.intersectionHistory[i]}}`);
		}
		facts.push(`{${this.context.currentSubset()}} tagged {${this.subcontext.intersected}, ...}`);
		return facts;
	}
}

class RefinePartitionPhase2 implements IPrisonerState<State> {
	phase: "refine-2" = "refine-2";

	context: PartitionContext;
	subcontext: PartitionSubcontext;
	previousAnnouncement: boolean;
	announcement: Announcement;

	constructor(context: PartitionContext, subcontext: PartitionSubcontext, previousAnnouncement: boolean, announcement: Announcement) {
		this.context = context;
		this.subcontext = subcontext;
		this.previousAnnouncement = previousAnnouncement;
		this.announcement = announcement;
	}

	next(t: boolean): State {
		let x = this.announcement.next(t);
		if (!x.done) {
			return new RefinePartitionPhase2(this.context, this.subcontext, this.previousAnnouncement, x.value);
		}

		// Did both announcements return a positive result? If so, we should abandon the outer loop,
		// split the partition, and start over.
		if (this.previousAnnouncement && x.value) {
			let splitContext = this.context.splitIndex(this.subcontext.round, this.subcontext.wasFlashed);
			return new FlashLightsPhase(splitContext);
		}

		// Otherwise, mark whether this group was intersected
		let newIntersected = this.subcontext.intersected.slice();
		if (this.previousAnnouncement) {
			newIntersected.push(this.subcontext.round);
		}

		// Go to the next j, if possible
		if (this.subcontext.round != this.context.numPartitions) {
			let newSubcontext = {
				wasFlashed: this.subcontext.wasFlashed,
				round: this.subcontext.round + 1,
				intersected: newIntersected,
			}
			return RefinePartitionPhase1.start(this.context, newSubcontext);
		}

		// Otherwise, we've finished checking for this subset. Go to the next one.
		let nextContext = this.context.bumpIndex(newIntersected);
		if (nextContext !== null) {
			// Hold up, what if we can solve this right now?
			let lhs = nextContext.enumerationOrder.slice(0, nextContext.enumerationPosition);
			let rhs = nextContext.intersectionHistory;
			let result = trySolveEquations(nextContext.numPartitions, lhs, rhs);
			if (result == null) {
				return new FlashLightsPhase(nextContext);
			} else {
				return new FinalState(nextContext.numPartitions, lhs, rhs);
			}
		} else {
			// Remember, gotta tack on the newIntersected. This is kinda clunky... :(
			return new FinalState(this.context.numPartitions, this.context.enumerationOrder, this.context.intersectionHistory.concat([newIntersected]));
		}
	}

	willFlip(): boolean {
		return this.announcement.active;
	}

	description(): string {
		return `(I = {${this.context.currentSubset()}}) Announcement: S_${this.subcontext.round} \\ T? Step ${this.announcement.day}/${this.context.upperBound}`;
	}

	commonKnowledge(): string[] {
		let facts = [`N ≤ ${this.context.upperBound}`, `${this.context.numPartitions} partitions`];
		for (let i = 0; i < this.context.enumerationPosition; i++) {
			facts.push(`{${this.context.enumerationOrder[i]}} tagged {${this.context.intersectionHistory[i]}}`);
		}
		facts.push(`{${this.context.currentSubset()}} tagged {${this.subcontext.intersected}, ...}`);
		return facts;
	}
}

class FinalState implements IPrisonerState<State> {
	phase: "final" = "final";

	numPartitions: number;
	enumerationOrder: number[][];
	intersectionHistory: number[][];

	constructor(numPartitions: number, enumerationOrder: number[][], intersectionHistory: number[][]) {
		this.numPartitions = numPartitions;
		this.enumerationOrder = enumerationOrder;
		this.intersectionHistory = intersectionHistory;
	}

	next(t: boolean): State {
		return this;
	}

	willFlip(): boolean {
		return false;
	}

	description(): string {
		return `Puzzle Complete`
	}

	commonKnowledge(): string[] {
		let facts = this.enumerationOrder.map((lhs, i) => {
			let rhs = this.intersectionHistory[i];
			let lhsStr = lhs.map(i => `x_${i}`).join(" + ");
			let rhsStr = rhs.map(i => `x_${i}`).join(" + ");
			return `${lhsStr} = ${rhsStr}`;
		});
		facts.push("x_1 = 1");
		
		// Now get the unique solution
		let solution = trySolveEquations(this.numPartitions, this.enumerationOrder, this.intersectionHistory)!;
		let solnStr = solution.map((x, i) => `x_${i+1} = ${x}`).join(", ");
		let total = solution.reduce((a, b) => a + b);
		facts.push(`Unique solution is: ${solnStr}, for a total of ${total} prisoners`);

		return facts;
	}
}

export class Graphics {
	group: svgjs.G;
	circle: svgjs.Circle;
	name: svgjs.Text;
	number: svgjs.Text;
	candidate: svgjs.Circle;
	switch: svgjs.Polygon;

	constructor(drawing: svgjs.Doc, name: string) {
		this.group = drawing.group();
		this.circle = this.group.circle(2 * PRISONER_RADIUS);
		this.name = this.group.text(name);
		this.number = this.group.text("");
		this.candidate = this.group.circle(COIN_DIAMETER).hide();
		this.switch = this.group.polygon([0, 0, 0, SWITCH_HEIGHT, SWITCH_WIDTH, SWITCH_HEIGHT / 2]);

		// Position the elements
		let cx = this.circle.cx();
		let cy = this.circle.cy();
		this.name.center(cx, cy);
		this.candidate.center(cx + PRISONER_RADIUS, cy - PRISONER_RADIUS);
		this.switch.center(cx + PRISONER_SPACING / 2, cy);

		// Color them
		this.circle.fill(INACTIVE_COLOR).stroke(BORDER_COLOR);
		this.candidate.fill(CANDIDATE_COLOR).stroke(BORDER_COLOR);
		this.switch.fill(INACTIVE_COLOR).stroke(BORDER_COLOR);

		// Push the circle to the rearmost
		this.circle.back();
	}

	drawState(state: State, light: boolean | null) {

		let color: string;
		let number: number | null;
		let candidate: boolean;

		switch (state.phase) {
			case "upper-bound": {
				if (state.inner.phase == "waxing") {
					let active = state.inner.active || (light ?? false);
					color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				} else {
					let active = state.inner.active && (light ?? true);
					color = active ? WANING_COLOR : INACTIVE_COLOR;
				}
				number = null;
				candidate = false;
				break;
			}
			case "flash": {
				let active = state.context.inCurrentSubset();
				color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				number = state.context.myPartition;
				candidate = (light ?? false);
				break;
			}
			case "refine-1": {
				let active = state.announcement.active || (light ?? false);
				color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				number = state.context.myPartition;
				candidate = state.subcontext.wasFlashed;
				break;
			}
			case "refine-2": {
				let active = state.announcement.active || (light ?? false);
				color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				number = state.context.myPartition;
				candidate = state.subcontext.wasFlashed;
				break;
			}
			case "final": {
				color = INACTIVE_COLOR;
				number = null;
				candidate = false;
				break;
			}
			default:
				const _exhaustiveCheck: never = state;
				return _exhaustiveCheck;
		}

		this.circle.fill(color);

		if (number !== null) {
			this.number.show().text(number.toString());
		} else {
			this.number.hide();
		}

		if (candidate) {
			this.candidate.show();
		} else {
			this.candidate.hide();
		}

		// Reposition the text
		this.number.center(this.circle.cx() - PRISONER_RADIUS, this.circle.cy() + PRISONER_RADIUS);
	}

	drawSwitch(willFlip: boolean) {
		this.switch.fill(willFlip ? ACTIVE_COLOR : INACTIVE_COLOR);
	}

	move(x: number, y: number): void {
		this.group.move(x, y);
	}
}

// If there's a unique solution, returns it, otherwise returns null
function trySolveEquations(numVariables: number, lhss: number[][], rhss: number[][]): number[] | null {
	// Remember, these are 1-indexed! TODO: make everything 0 indexed where possible

	let numRows = lhss.length + 1;  // +1 because x_1 = 1
	let numCols = numVariables + 1;

	let rows = lhss.map((lhs, i) => {
		let rhs = rhss[i];
		let row: number[] = Array(numCols).fill(0);
		for (let x of lhs) {
			row[x - 1] += 1;
		}
		for (let x of rhs) {
			row[x - 1] -= 1;
		}
		return row;
	});

	// This row encodes the fact that x_1 = 1
	let lastRow = Array(numCols).fill(0);
	lastRow[0] = lastRow[numCols - 1] = 1;
	rows.push(lastRow);

	// TODO: shunt this into some stdlib
	function range(a: number, b: number) {
		if (b < a) {
			return [];
		}
		return Array(b - a).fill(0).map((_, i) => i + a);
	}

	function max_by<T>(array: T[], key: (t: T) => number): T {
		return array.reduce((a, b) => key(a) >= key(b) ? a : b);
	}

	// Now put the matrix in RREF form
	let pivotRow = 0;
	let pivotColumn = 0;
	while (pivotRow < numRows && pivotColumn < numCols) {
		// Find the pivot for this column
		let [valMax, iMax] = max_by(
			range(pivotRow, numRows).map(i => [rows[i][pivotColumn], i]),
			tup => Math.abs(tup[0])
		);

		if (valMax == 0) {
			// No pivot in this column
			pivotColumn += 1;
		} else {
			// Swap this row into the pivot row
			let tmp = rows[pivotRow];
			rows[pivotRow] = rows[iMax];
			rows[iMax] = tmp;

			// Normalize this row
			let mul = rows[pivotRow][pivotColumn];
			for (let j = 0; j < numCols; j++) {
				rows[pivotRow][j] /= mul;
			}

			// For all rows other than pivot, clear the column
			for (let i = 0; i < rows.length; i++) {
				if (i == pivotRow) {
					continue;
				}

				let mul = rows[i][pivotColumn];
				for (let j = 0; j < numCols; j++) {
					rows[i][j] -= rows[pivotRow][j] * mul;
				}
			}
			pivotRow += 1;
			pivotColumn += 1;
		}
	}

	// Detect whether we have a solution.
	if (numRows < numVariables) {
		return null;
	}
	
	// Check if the upper-left looks like an identity matrix.
	for (let i = 0; i < numVariables; i++) {
		for (let j = 0; j < numVariables; j++) {
			if (i == j && rows[i][j] != 1) {
				return null;
			}
			if (i != j && rows[i][j] != 0) {
				return null;
			}
		}
	}

	// Sanity check, all other rows should be all zero
	for (let i = numVariables; i < numRows; i++) {
		for (let j = 0; j < numCols; j++) {
			if (rows[i][j] != 0) {
				throw "RREF failure!" + rows.toString();
			}
		}
	}

	// Great! Now we just copy off the last column
	return range(0, numVariables).map(i => rows[i][numCols - 1]);
}