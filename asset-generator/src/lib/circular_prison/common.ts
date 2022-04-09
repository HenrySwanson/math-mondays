"use strict";

import type { FiniteStateMachine, Subprocedure, SubprocedureResult } from "../fsm";

export interface IPrisonerState<S> extends FiniteStateMachine<boolean, S> {
	willFlip(): boolean;
	description(): string;
	phase: string;  // TODO: make "final" less special
}

export interface IPrisonerGraphics<S> {
	drawState(state: S, light: boolean | null): void;
	drawSwitch(willFlip: boolean): void;
	move(x: number, y: number): void;
}

// Common Subprocedures

export class WaxingPhase implements Subprocedure<boolean, WaxingPhase | WaningPhase, number> {
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

	next(t: boolean): SubprocedureResult<WaxingPhase | WaningPhase, number> {
		let active = this.active || t;
		if (this.day < this.round) {
			return { done: false, value: new WaxingPhase(this.captain, this.round, this.day + 1, active) };
		} else {
			return { done: false, value: new WaningPhase(this.captain, this.round, 1, active) };
		}
	}
}

export class WaningPhase implements Subprocedure<boolean, WaxingPhase | WaningPhase, number> {
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

	next(t: boolean): SubprocedureResult<WaxingPhase | WaningPhase, number> {
		let active = this.active && t;
		if (this.day < 2 ** this.round) {
			return { done: false, value: new WaningPhase(this.captain, this.round, this.day + 1, active) };
		} else if (!active) {
			return { done: false, value: new WaxingPhase(this.captain, this.round + 1, 1, this.captain) };
		} else {
			return { done: true, value: 2 ** this.round };
		}
	}
}

export class Announcement implements Subprocedure<boolean, Announcement, boolean> {
	active: boolean;
	numDays: number;
	day: number;

	constructor(active: boolean, numDays: number, day: number) {
		this.active = active;
		this.numDays = numDays;
		this.day = day;
	}

	next(t: boolean): SubprocedureResult<Announcement, boolean> {
		let active = this.active || t;
		if (this.day < this.numDays) {
			return { done: false, value: new Announcement(active, this.numDays, this.day + 1) };
		} else {
			return { done: true, value: active };
		}
	}
}