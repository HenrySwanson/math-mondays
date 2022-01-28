"use strict";

// TODO general Finite State machine interface?
export interface PrisonerStateInterface<S> {
	next(t: boolean): S;
	willFlip(): boolean;
}