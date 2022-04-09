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
}

// TODO there's gotta be a better way than defining boring constructors
class PartitionContext {
	upperBound: number;
	numPartitions: number;
	myPartition: number;
	enumerationOrder: number[][];
	enumerationPosition: number;
	intersectionHistory: boolean[][];

	constructor(upperBound: number,
		numPartitions: number,
		myPartition: number,
		enumerationOrder: number[][],
		enumerationPosition: number,
		intersectionHistory: boolean[][]
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

	bumpIndex(intersection: boolean[]): PartitionContext | null {
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
	intersected: boolean[];
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

		// Go to the next j, if possible
		if (this.subcontext.round != this.context.numPartitions) {
			let newSubcontext = {
				wasFlashed: this.subcontext.wasFlashed,
				round: this.subcontext.round + 1,
				intersected: this.subcontext.intersected.concat([this.previousAnnouncement]),
			}
			return RefinePartitionPhase1.start(this.context, newSubcontext);
		}

		// Otherwise, we've finished checking for this subset. Go to the next one.
		let nextContext = this.context.bumpIndex(this.subcontext.intersected);
		if (nextContext !== null) {
			return new FlashLightsPhase(nextContext);
		} else {
			return new FinalState(this.context.numPartitions, this.context.enumerationOrder, this.context.intersectionHistory);
		}
	}

	willFlip(): boolean {
		return this.announcement.active;
	}

	description(): string {
		return `(I = {${this.context.currentSubset()}}) Announcement: S_${this.subcontext.round} \\ T? Step ${this.announcement.day}/${this.context.upperBound}`;
	}
}

class FinalState implements IPrisonerState<State> {
	phase: "final" = "final";

	numPartitions: number;
	enumerationOrder: number[][];
	intersectionHistory: boolean[][];

	constructor(numPartitions: number, enumerationOrder: number[][], intersectionHistory: boolean[][]) {
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
