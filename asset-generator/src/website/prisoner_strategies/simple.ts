"use strict";

import { PrisonerStateInterface } from "./common";
    
export type State = WaxingPhase | WaningPhase | AnyoneUnnumberedPhase | FinalState | CandidateSelectionPhase | CandidateReportingPhase | CandidateAnnouncementPhase;

export function startState(captain: boolean): State {
    return new WaxingPhase(captain, 1, 1, captain);
}

// TODO: use these to create sub machines and use those for announcements
// function* announcement(signal: boolean, upperBound: number, state: PrisonerState, question: string): Subprocedure<boolean> {
// 	if (signal) {
// 		yield* sendBit(upperBound, state, question);
// 		return signal;
// 	} else {
// 		let result = yield* receiveBit(upperBound, state, question);
// 		return result;
// 	}
// }

// function* sendBit(upperBound: number, state: PrisonerState, question: string): Subprocedure<void> {
// 	for (let i = 1; i <= upperBound; i++) {
// 		state.setActive(true);
// 		state.setCommon(`Announcement: ${question}: Step ${i}/${upperBound}`);
// 		yield true;
// 	}
// }

// function* receiveBit(upperBound: number, state: PrisonerState, question: string): Subprocedure<boolean> {
// 	let active = false;
// 	for (let i = 1; i <= upperBound; i++) {
// 		state.setActive(active);
// 		state.setCommon(`Announcement: ${question}: Step ${i}/${upperBound}`);
// 		let sawSignal: boolean = yield active;
// 		active ||= sawSignal;
// 	}
// 	return active;
// }


class WaxingPhase implements PrisonerStateInterface<State> {
	phase: "waxing" = "waxing";

	captain: boolean;
	round: number;
	day: number;
	active: boolean;

	constructor(captain: boolean, round: number, day: number, active: boolean) {
		this.captain = captain;
		this.round = round;
		this.day = day;
		this.active = active;
	}

	next(t: boolean): State {
		let active = this.active || t;
		if (this.day < this.round) {
			return new WaxingPhase(this.captain, this.round, this.day + 1, active);
		} else {
			return new WaningPhase(this.captain, this.round, 1, active);
		}
	}

	willFlip(): boolean {
		return this.active;
	}
}

class WaningPhase implements PrisonerStateInterface<State> {
	phase: "waning" = "waning";

	captain: boolean;
	round: number;
	day: number;
	active: boolean;

	constructor(captain: boolean, round: number, day: number, active: boolean) {
		this.captain = captain;
		this.round = round;
		this.day = day;
		this.active = active;
	}

	next(t: boolean): State {
		let active = this.active && t;
		if (this.day < 2 ** this.round) {
			return new WaningPhase(this.captain, this.round, this.day + 1, active);
		} else if (!active) {
			return new WaxingPhase(this.captain, this.round + 1, 1, this.captain);
		} else {
			return new AnyoneUnnumberedPhase({ "myNumber": this.captain ? 1 : null, "numNumbered": 1, upperBound: 2 ** this.round }, 1, !this.captain);
		}
	}

	willFlip(): boolean {
		return this.active;
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
	day: number;
	active: boolean;

	constructor(context: NumberingPhaseContext, day: number, active: boolean) {
		this.context = context;
		this.day = day;
		this.active = active;
	}

	next(t: boolean): State {
		if (this.day < this.context.upperBound) {
			return new AnyoneUnnumberedPhase(this.context, this.day + 1, this.active || t);
		} else if (this.active) {
			let probability = 1 / this.context.numNumbered;
			let coinFlip = (this.context.myNumber !== null) ? Math.random() < probability : false;
			return new CandidateSelectionPhase(this.context, coinFlip);
		} else {
			return new FinalState(this.context.numNumbered);
		}
	}

	willFlip(): boolean {
		return this.active;
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
		return CandidateReportingPhase.startOfRound(this.context, this.coinFlip, t, 0, 1);
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
	day: number;
	active: boolean;

	constructor(context: NumberingPhaseContext, coinFlip: boolean, isCandidate: boolean, numHeads: number, round: number, day: number, active: boolean) {
		this.context = context;
		this.coinFlip = coinFlip;
		this.isCandidate = isCandidate;
		this.numHeads = numHeads;
		this.round = round;
		this.day = day;
		this.active = active;
	}

	static startOfRound(context: NumberingPhaseContext, coinFlip: boolean, isCandidate: boolean, numberHeads: number, round: number): CandidateReportingPhase {
		// We're active this round if the new round is our number and we flipped heads
		let active = (round == context.myNumber) && coinFlip;
		return new CandidateReportingPhase(context, coinFlip, isCandidate, numberHeads, round, 1, active);
	}

	next(t: boolean): State {
		let active = this.active || t;
		if (this.day < this.context.upperBound) {
			return new CandidateReportingPhase(this.context, this.coinFlip, this.isCandidate, this.numHeads, this.round, this.day + 1, active);
		}

		// If we're active it means that someone flipped heads
		let newNumHeads = this.numHeads + (active ? 1 : 0);

		if (this.round < this.context.numNumbered) {
			return CandidateReportingPhase.startOfRound(this.context, this.coinFlip, this.isCandidate, newNumHeads, this.round + 1);
		} else {
			return new CandidateAnnouncementPhase(this.context, this.isCandidate, newNumHeads, 1, this.context.myNumber === null && this.isCandidate);
		}
	}

	willFlip(): boolean {
		return this.active;
	}
}

class CandidateAnnouncementPhase implements PrisonerStateInterface<State> {
	phase: "candidate-announce" = "candidate-announce";

	context: NumberingPhaseContext;
	isCandidate: boolean;
	numHeads: number;
	day: number;
	active: boolean;

	constructor(context: NumberingPhaseContext, isCandidate: boolean, numHeads: number, day: number, active: boolean) {
		this.context = context;
		this.isCandidate = isCandidate;
		this.numHeads = numHeads;
		this.day = day;
		this.active = active;
	}

	next(t: boolean): State {
		let active = this.active || t;
		if (this.day < this.context.upperBound) {
			return new CandidateAnnouncementPhase(this.context, this.isCandidate, this.numHeads, this.day + 1, active)
		} else {
			// If there was one heads, and some unnumbered candidate announced, then
			// we've assigned a new number :D
			let existsUnnumberedCandidate = active;
			let numNumbered = this.context.numNumbered;
			let myNumber = this.context.myNumber;

			if (existsUnnumberedCandidate && this.numHeads == 1) {
				numNumbered += 1;
				if (this.isCandidate) {
					myNumber = numNumbered;
				}
			}
			return new AnyoneUnnumberedPhase({ myNumber, numNumbered, "upperBound": this.context.upperBound }, 1, myNumber === null)
		}
	}

	willFlip(): boolean {
		return this.active;
	}
}