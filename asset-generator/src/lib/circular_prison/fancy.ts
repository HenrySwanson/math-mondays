"use strict";

import { Subprocedure, SubprocedureResult } from "../fsm";
import { zip } from "../iter";
import { Matrix } from "../matrix";
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

	constructor(public inner: WaxingPhase | WaningPhase) { }

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

// Create a list of all subsets, except the trivial ones
function getSubsetList(n: number): number[][] {
	let subsets: number[][] = [[]];
	for (let i = 1; i <= n; i++) {
		// Add subsets with and without the element i
		subsets = subsets.concat(subsets.map(x => x.concat([i])));
	}

	// Drop the first and last element
	subsets = subsets.slice(1, -1);

	subsets.sort((a, b) => {
		let lengthDiff = a.length - b.length;
		if (lengthDiff != 0) {
			return lengthDiff;
		}
		for(let i = 0; i < a.length; i++) {
			let diff = a[i] - b[i];
			if (diff != 0) {
				return diff;
			}
		}
		return 0;
	})

	return subsets;
}

type Equation = {
	lhs: number[],
	rhs: number[],
}

class PartitionContext implements Subprocedure<number[], PartitionContext, Equation[]> {

	constructor(public upperBound: number,
		public numPartitions: number,
		public myPartition: number,
		public enumerationOrder: number[][],
		public enumerationPosition: number,
		public intersectionHistory: number[][]) { }

	static createNew(upperBound: number, numPartitions: number, myPartition: number): PartitionContext {
		return new PartitionContext(
			upperBound,
			numPartitions,
			myPartition,
			getSubsetList(numPartitions),
			0,
			[],
		)
	}

	next(t: number[]): SubprocedureResult<PartitionContext, Equation[]> {
		if (this.enumerationPosition == this.enumerationOrder.length) {
			throw "Internal error, should not have called PartitionContext.next() that many times";
		}

		// Add the new equation
		let copy = new PartitionContext(
			this.upperBound,
			this.numPartitions,
			this.myPartition,
			this.enumerationOrder,
			this.enumerationPosition,
			this.intersectionHistory);
		copy.intersectionHistory.push(t);
		copy.enumerationPosition += 1;

		// Check if we can solve the equation right now
		let equations = zip(copy.enumerationOrder, copy.intersectionHistory).map(
			([x, y]) => ({ lhs: x, rhs: y })
		);
		let result = trySolveEquations(copy.numPartitions, equations);
		if (result == null) {
			return { done: false, value: copy };
		} else {
			return { done: true, value: equations };
		}
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

class PartitionSubcontext implements Subprocedure<boolean, PartitionSubcontext, number[]> {

	constructor(
		public numPartitions: number,
		public wasFlashed: boolean,
		public round: number,
		public intersected: number[]) { }

	next(t: boolean): SubprocedureResult<PartitionSubcontext, number[]> {
		let x = this.intersected.concat(t ? [this.round] : []);

		if (this.round != this.numPartitions) {
			return { done: false, value: new PartitionSubcontext(this.numPartitions, this.wasFlashed, this.round + 1, x) };
		}

		return { done: true, value: x };
	}
}

class FlashLightsPhase implements IPrisonerState<State> {
	phase: "flash" = "flash";

	constructor(public context: PartitionContext) { }

	next(t: boolean): State {
		let subcontext = new PartitionSubcontext(this.context.numPartitions, t, 1, []);
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

	constructor(
		public context: PartitionContext,
		public subcontext: PartitionSubcontext,
		public announcement: Announcement) { }

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

	constructor(
		public context: PartitionContext,
		public subcontext: PartitionSubcontext,
		public previousAnnouncement: boolean,
		public announcement: Announcement) { }

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

		// Check whether we're still working in the same round
		let result = this.subcontext.next(this.previousAnnouncement);
		if (!result.done) {
			return RefinePartitionPhase1.start(this.context, result.value);
		}

		// Check whether we're done with the parent context too
		let result2 = this.context.next(result.value);
		if (!result2.done) {
			return new FlashLightsPhase(result2.value);
		}

		// Otherwise, we're done!
		return new FinalState(this.context.numPartitions, result2.value);
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

	constructor(
		public numPartitions: number,
		public equations: Equation[]) { }

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
		let facts = this.equations.map(e => {
			let lhsStr = e.lhs.map(i => `x_${i}`).join(" + ");
			let rhsStr = e.rhs.map(i => `x_${i}`).join(" + ");
			return `${lhsStr} = ${rhsStr}`;
		});
		facts.push("x_1 = 1");

		// Now get the unique solution
		let solution = trySolveEquations(this.numPartitions, this.equations)!;
		let solnStr = solution.map((x, i) => `x_${i + 1} = ${x}`).join(", ");
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
function trySolveEquations(numVariables: number, equations: Equation[]): number[] | null {
	// Remember, these are 1-indexed! TODO: make everything 0 indexed where possible

	let rows = equations.map(e => {
		let row: number[] = Array(numVariables + 1).fill(0);
		for (let x of e.lhs) {
			row[x - 1] += 1;
		}
		for (let x of e.rhs) {
			row[x - 1] -= 1;
		}
		return row;
	});

	// This row encodes the fact that x_1 = 1
	let lastRow = Array(numVariables + 1).fill(0);
	lastRow[0] = lastRow[numVariables] = 1;
	rows.push(lastRow);

	let m = Matrix.fromRows(rows);
	m.rref();

	// Detect whether we have a solution.
	if (m.nRows < numVariables) {
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
	for (let i = numVariables; i < m.nRows; i++) {
		for (let j = 0; j < m.nCols; j++) {
			if (rows[i][j] != 0) {
				throw "RREF failure!" + rows.toString();
			}
		}
	}

	// Great! Now we just copy off the last column
	return m.getCol(m.nCols - 1).slice(0, numVariables);
}