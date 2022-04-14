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

export type State = UpperBoundPhase | AnyoneUnnumberedPhase | FinalState | CandidateSelectionPhase | CandidateReportingPhase | CandidateAnnouncementPhase;

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

		return AnyoneUnnumberedPhase.start({ myNumber: this.inner.captain ? 1 : null, numNumbered: 1, upperBound: x.value });
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

type NumberingPhaseContext = {
	myNumber: number | null;
	numNumbered: number;
	upperBound: number;
}

class AnyoneUnnumberedPhase implements IPrisonerState<State> {
	phase: "unnumbered-announce" = "unnumbered-announce";

	constructor(public context: NumberingPhaseContext, public announcement: Announcement) { }

	static start(context: NumberingPhaseContext): AnyoneUnnumberedPhase {
		let a = new Announcement(context.myNumber === null, context.upperBound, 1);
		return new AnyoneUnnumberedPhase(context, a);
	}

	// TODO: this kind of pattern keeps happening. How do I reduce this?
	next(t: boolean): State {
		let x = this.announcement.next(t);
		if (!x.done) {
			return new AnyoneUnnumberedPhase(this.context, x.value);
		}

		// If we're still active, someone was unnumbered. Proceed.
		if (x.value) {
			let probability = 1 / this.context.numNumbered;
			let coinFlip = (this.context.myNumber !== null) ? Math.random() < probability : false;
			return new CandidateSelectionPhase(this.context, coinFlip);
		} else {
			// Otherwise we're done!
			return new FinalState(this.context.numNumbered);
		}
	}

	willFlip(): boolean {
		return this.announcement.active;
	}

	description(): string {
		return `Announcement: Anyone Unnumbered? Step ${this.announcement.day}/${this.context.upperBound}`;
	}

	commonKnowledge(): string[] {
		return [`N ≤ ${this.context.upperBound}`, `${this.context.numNumbered} prisoners numbered`];
	}
}

class FinalState implements IPrisonerState<State> {
	phase: "final" = "final";

	constructor(public answer: number) { }

	next(t: boolean): State {
		return this;
	}

	willFlip(): boolean {
		return false;
	}

	description(): string {
		return `Puzzle Complete`;
	}

	commonKnowledge(): string[] {
		return [`N = ${this.answer}`];
	}
}

class CandidateSelectionPhase implements IPrisonerState<State> {
	phase: "coin-flip" = "coin-flip";

	constructor(public context: NumberingPhaseContext, public coinFlip: boolean) { }

	next(t: boolean): State {
		return CandidateReportingPhase.start(this.context, this.coinFlip, t);
	}

	willFlip(): boolean {
		return this.coinFlip;
	}

	description(): string {
		return `Numbered Prisoners Flip Coin`;
	}

	commonKnowledge(): string[] {
		return [`N ≤ ${this.context.upperBound}`, `${this.context.numNumbered} prisoners numbered`];
	}
}

class CandidateReportingPhase implements IPrisonerState<State> {
	phase: "coin-announce" = "coin-announce";

	constructor(
		public context: NumberingPhaseContext,
		public coinFlip: boolean,
		public isCandidate: boolean,
		public numHeads: number,
		public round: number,
		public announcement: Announcement) { }

	static start(context: NumberingPhaseContext, coinFlip: boolean, isCandidate: boolean): CandidateReportingPhase {
		return CandidateReportingPhase.startOfRound(context, coinFlip, isCandidate, 0, 1);
	}

	static startOfRound(context: NumberingPhaseContext, coinFlip: boolean, isCandidate: boolean, numberHeads: number, round: number): CandidateReportingPhase {
		// We're active this round if the new round is our number and we flipped heads
		let a = new Announcement((round == context.myNumber) && coinFlip, context.upperBound, 1);
		return new CandidateReportingPhase(context, coinFlip, isCandidate, numberHeads, round, a);
	}

	next(t: boolean): State {
		let x = this.announcement.next(t);
		if (!x.done) {
			return new CandidateReportingPhase(this.context, this.coinFlip, this.isCandidate, this.numHeads, this.round, x.value);
		}

		// If we're active it means that someone flipped heads
		let newNumHeads = this.numHeads + (x.value ? 1 : 0);

		if (this.round < this.context.numNumbered) {
			return CandidateReportingPhase.startOfRound(this.context, this.coinFlip, this.isCandidate, newNumHeads, this.round + 1);
		} else {
			return CandidateAnnouncementPhase.start(this.context, this.isCandidate, newNumHeads);
		}
	}

	willFlip(): boolean {
		return this.announcement.active;
	}

	description(): string {
		return `Announcement: Results of ${this.round}'s flip. Step ${this.announcement.day}/${this.context.upperBound}`;
	}

	commonKnowledge(): string[] {
		return [`N ≤ ${this.context.upperBound}`, `${this.context.numNumbered} prisoners numbered`, `${this.numHeads} heads flipped (so far)`];
	}
}

class CandidateAnnouncementPhase implements IPrisonerState<State> {
	phase: "candidate-announce" = "candidate-announce";

	constructor(
		public context: NumberingPhaseContext,
		public isCandidate: boolean,
		public numHeads: number,
		public announcement: Announcement) { }

	static start(context: NumberingPhaseContext, isCandidate: boolean, numHeads: number): CandidateAnnouncementPhase {
		let a = new Announcement(context.myNumber === null && isCandidate, context.upperBound, 1);
		return new CandidateAnnouncementPhase(context, isCandidate, numHeads, a);
	}

	next(t: boolean): State {
		let x = this.announcement.next(t);
		if (!x.done) {
			return new CandidateAnnouncementPhase(this.context, this.isCandidate, this.numHeads, x.value);
		} else {
			// If there was one heads, and some unnumbered candidate announced, then
			// we've assigned a new number :D
			let existsUnnumberedCandidate = x.value;
			let numNumbered = this.context.numNumbered;
			let myNumber = this.context.myNumber;

			if (existsUnnumberedCandidate && this.numHeads == 1) {
				numNumbered += 1;
				if (this.isCandidate) {
					myNumber = numNumbered;
				}
			}
			return AnyoneUnnumberedPhase.start({ myNumber, numNumbered, "upperBound": this.context.upperBound })
		}
	}

	willFlip(): boolean {
		return this.announcement.active;
	}

	description(): string {
		return `Announcement: Unnumbered Candidate? Step ${this.announcement.day}/${this.context.upperBound}`;
	}

	commonKnowledge(): string[] {
		return [`N ≤ ${this.context.upperBound}`, `${this.context.numNumbered} prisoners numbered`, `${this.numHeads} heads flipped`];
	}
}

// TODO: maybe we do state.render(graphics)?
export class Graphics {
	group: svgjs.G;
	circle: svgjs.Circle;
	name: svgjs.Text;
	number: svgjs.Text;
	coin: svgjs.Circle;
	candidate: svgjs.Circle;
	switch: svgjs.Polygon;

	constructor(drawing: svgjs.Doc, name: string) {
		this.group = drawing.group();
		this.circle = this.group.circle(2 * PRISONER_RADIUS);
		this.name = this.group.text(name);
		this.number = this.group.text("");
		this.coin = this.group.circle(COIN_DIAMETER).hide();
		this.candidate = this.group.circle(COIN_DIAMETER).hide();
		this.switch = this.group.polygon([0, 0, 0, SWITCH_HEIGHT, SWITCH_WIDTH, SWITCH_HEIGHT / 2]);

		// Position the elements
		let cx = this.circle.cx();
		let cy = this.circle.cy();
		this.name.center(cx, cy);
		this.coin.center(cx + PRISONER_RADIUS, cy + PRISONER_RADIUS);
		this.candidate.center(cx + PRISONER_RADIUS, cy - PRISONER_RADIUS);
		this.switch.center(cx + PRISONER_SPACING / 2, cy);

		// Color them
		this.circle.fill(INACTIVE_COLOR).stroke(BORDER_COLOR);
		this.coin.stroke(BORDER_COLOR);
		this.candidate.fill(CANDIDATE_COLOR).stroke(BORDER_COLOR);
		this.switch.fill(INACTIVE_COLOR).stroke(BORDER_COLOR);

		// Push the circle to the rearmost
		this.circle.back();
	}

	drawState(state: State, light: boolean | null) {

		let color: string;
		let number: number | null;
		let coin: boolean | null;
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
				coin = null;
				candidate = false;
				break;
			}
			case "unnumbered-announce": {
				let active = state.announcement.active || (light ?? false);
				color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				number = state.context.myNumber ?? null;
				coin = null;
				candidate = false;
				break;
			}
			case "coin-flip": {
				color = INACTIVE_COLOR;
				number = state.context.myNumber ?? null;
				coin = state.context.myNumber !== null ? state.coinFlip : null;
				candidate = light ?? false;
				break;
			}
			case "coin-announce": {
				let active = state.announcement.active || (light ?? false);
				color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				number = state.context.myNumber ?? null;
				coin = state.context.myNumber !== null ? state.coinFlip : null;
				candidate = state.isCandidate;
				break;
			}
			case "candidate-announce": {
				let active = state.announcement.active || (light ?? false);
				color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				number = state.context.myNumber ?? null;
				coin = null;
				candidate = state.isCandidate;
				break;
			}
			case "final": {
				color = INACTIVE_COLOR;
				number = null;
				coin = null;
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

		if (coin !== null) {
			this.coin.show().fill(coin ? ACTIVE_COLOR : INACTIVE_COLOR);
		} else {
			this.coin.hide();
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
