"use strict";

// T: Input type, what the FSM consumes to change states
// S: State type, what the FSM's state is represented by
export interface FiniteStateMachine<T, S> {
    next(t: T): S;
}

export type SubprocedureResult<S, R> = { done: false; value: S; } | { done: true; value: R };

export type Subprocedure<T, S, R> = FiniteStateMachine<T, SubprocedureResult<S, R>>