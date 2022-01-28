"use strict";

import { PrisonerStateInterface, Announcement, WaxingPhase, WaningPhase } from "./common";

export type State = UpperBoundPhase | AnyoneUnnumberedPhase | FinalState | CandidateSelectionPhase | CandidateReportingPhase | CandidateAnnouncementPhase;

export function startState(captain: boolean): State {
	return UpperBoundPhase.start(captain);
}


class UpperBoundPhase implements PrisonerStateInterface<State> {
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

		return AnyoneUnnumberedPhase.start({ myNumber: this.inner.captain ? 1 : null, numNumbered: 1, upperBound: x.value });
	}

	willFlip(): boolean {
		return this.inner.active;
	}
}

type NumberingPhaseContext = {
	myNumber: number | null;
	numNumbered: number;
	upperBound: number;
}

class AnyoneUnnumberedPhase implements PrisonerStateInterface<State> {
	phase: "unnumbered-announce" = "unnumbered-announce";

	context: NumberingPhaseContext;
	announcement: Announcement;

	constructor(context: NumberingPhaseContext, announcement: Announcement) {
		this.context = context;
		this.announcement = announcement;
	}

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
}

class FinalState implements PrisonerStateInterface<State> {
	phase: "final" = "final";

	answer: number;

	constructor(answer: number) {
		this.answer = answer;
	}

	next(t: boolean): State {
		return this;
	}

	willFlip(): boolean {
		return false;
	}

}

class CandidateSelectionPhase implements PrisonerStateInterface<State> {
	phase: "coin-flip" = "coin-flip";

	context: NumberingPhaseContext;
	coinFlip: boolean;

	constructor(context: NumberingPhaseContext, coinFlip: boolean) {
		this.context = context;
		this.coinFlip = coinFlip;
	}

	next(t: boolean): State {
		return CandidateReportingPhase.start(this.context, this.coinFlip, t);
	}

	willFlip(): boolean {
		return this.coinFlip;
	}
}

class CandidateReportingPhase implements PrisonerStateInterface<State> {
	phase: "coin-announce" = "coin-announce";

	context: NumberingPhaseContext;
	coinFlip: boolean;
	isCandidate: boolean;
	numHeads: number;
	round: number;
	announcement: Announcement;

	constructor(context: NumberingPhaseContext, coinFlip: boolean, isCandidate: boolean, numHeads: number, round: number, announcement: Announcement) {
		this.context = context;
		this.coinFlip = coinFlip;
		this.isCandidate = isCandidate;
		this.numHeads = numHeads;
		this.round = round;
		this.announcement = announcement;
	}

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
}

class CandidateAnnouncementPhase implements PrisonerStateInterface<State> {
	phase: "candidate-announce" = "candidate-announce";

	context: NumberingPhaseContext;
	isCandidate: boolean;
	numHeads: number;
	announcement: Announcement;

	constructor(context: NumberingPhaseContext, isCandidate: boolean, numHeads: number, announcement: Announcement) {
		this.context = context;
		this.isCandidate = isCandidate;
		this.numHeads = numHeads;
		this.announcement = announcement;
	}

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
}