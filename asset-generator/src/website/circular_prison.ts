"use_strict";

import type { svgjs } from "svg.js";
import type { IPrisonerState, IPrisonerGraphics } from "../lib/circular_prison/common";
import { startState, State as SimpleState, Graphics as SimpleGraphics } from "../lib/circular_prison/simple";
import { startState as startStateFancy, State as FancyState, Graphics as FancyGraphics } from "../lib/circular_prison/fancy";

// Will be defined by the SVG.js script we pull in elsewhere in the doc
declare global { var SVG: svgjs.Library; }

// TODO: don't duplicate constants like this!
const PRISONER_RADIUS = 20;
const PRISONER_SPACING = 80;
const SCENE_PADDING = 10;

// TODO: now what? I have to figure out how to visually show this!
// okay, here's the way i see it
// - then add the ability to click and drag people into different slots
//   (w/ optional checkbox for random)
// - then add fancier visuals
// - start over button

class Prisoner<S extends IPrisonerState<S>> {
	graphics: IPrisonerGraphics<S>
	state: S
	name: string

	constructor(state: S, graphics: IPrisonerGraphics<S>, name: string) {
		this.graphics = graphics;
		this.state = state;
		this.name = name;
	}

	draw(light: boolean | null) {
		this.graphics.drawState(this.state, light);
		this.graphics.drawSwitch(this.state.willFlip());
	}
}

function shuffleArray<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

type ExperimentStateA = {
	state: "A";
}

type ExperimentStateB<S extends IPrisonerState<S>> = {
	state: "B";
	lights: Map<Prisoner<S>, boolean>;
}

type ExperimentStateC = {
	state: "C";
	answer: number;
}

type ExperimentState<S extends IPrisonerState<S>> = ExperimentStateA | ExperimentStateB<S> | ExperimentStateC;

class Experiment<S extends IPrisonerState<S>> {
	prisoners: Prisoner<S>[];
	state: ExperimentState<S>;
	numDays: number;
	historyStack: [Prisoner<S>, S][][];
	startStateFn: (captain: boolean) => S;

	constructor(drawing: svgjs.Doc, numPrisoners: number, startStateFn: (captain: boolean) => S, graphicsFn: (drawing: svgjs.Doc, name: string) => IPrisonerGraphics<S>) {
		this.prisoners = Array.from(Array(numPrisoners).keys()).map(
			i => {
				let captain = i == 0;
				let name = String.fromCharCode(65 + i);
				return new Prisoner(startStateFn(captain), graphicsFn(drawing, name), name);
			});
		this.state = { state: "A" };
		this.numDays = 1;
		this.historyStack = [];
		this.startStateFn = startStateFn;

		drawing.viewbox(
			0, 0, numPrisoners * PRISONER_SPACING + SCENE_PADDING, 2 * PRISONER_RADIUS + 2 * SCENE_PADDING
		)
	}

	advance() {
		const numPrisoners = this.prisoners.length;

		switch (this.state.state) {
			case "A": {
				// Prisoners have already decided whether to flip the switch, based on what they saw yesterday.
				let lights = new Map(
					this.prisoners.map((p, idx) => {
						// A prisoner will see a light if the prisoner before them flipped the switch.
						let prev = this.prisoners[(idx + numPrisoners - 1) % numPrisoners];
						let seesLight = prev.state.willFlip();
						return [p, seesLight];
					})
				);

				this.state = { state: "B", lights }
				break;
			} case "B": {
				// Nighttime, time to scramble the prisoners and update
				// their states. But first, save the state.
				let history: [Prisoner<S>, S][] = this.prisoners.map(p => [p, p.state]);
				this.historyStack.push(history);

				shuffleArray(this.prisoners);

				let lights = this.state.lights;
				this.prisoners.forEach(p => p.state = p.state.next(lights.get(p)!));

				this.state = { state: "A" };
				this.numDays += 1;
				break;
			} case "C": {
				// do nothing
				break;
			}
		}
	}

	undo(): void {
		switch (this.state.state) {
			case "A": {
				let history = this.historyStack.pop();
				if (history === undefined) {
					return;
				}

				this.prisoners = history.map(h => {
					let [p, state] = h;
					p.state = state;
					return p;
				});
				this.numDays -= 1;

				this.advance();
				break;
			} case "B": {
				// Drop the extra data
				this.state = { state: "A" };
				break;
			} case "C": {
				// do nothing
				break;
			}
		}
	}

	startOver(): void {
		this.prisoners.sort((a, b) => a.name.localeCompare(b.name));
		this.prisoners.forEach((p, i) => p.state = this.startStateFn(i == 0));
		this.state = { state: "A" };
		this.numDays = 1;
		this.historyStack = [];
	}

	draw(): void {
		// Move prisoner graphics
		this.prisoners.forEach((p, i) => {
			p.graphics.move(SCENE_PADDING + PRISONER_SPACING * i, SCENE_PADDING);
		});

		switch (this.state.state) {
			case "A": {
				this.prisoners.forEach(p => p.draw(null));
				break;
			} case "B": {
				let lights = this.state.lights;
				this.prisoners.forEach(p => p.draw(lights.get(p)!));
				break;
			} case "C": {
				// do nothing
				break;
			}
		}
	}

	currentState(): string {
		let state = this.prisoners[0].state;
		return state.description();
	}
}

// TODO add 'start over' functionality!
// TODO common knowledge field
class ExperimentApplet<S extends IPrisonerState<S>> {
	experiment: Experiment<S>;
	nextButton: HTMLButtonElement;
	undoButton: HTMLButtonElement;
	finishPhaseButton: HTMLButtonElement;
	startOverButton: HTMLButtonElement;
	dayCounter: HTMLSpanElement;
	stateText: HTMLSpanElement;

	constructor(numPrisoners: number, suffix: string, startStateFn: (captain: boolean) => S, graphicsFn: (drawing: svgjs.Doc, name: string) => IPrisonerGraphics<S>) {
		this.experiment = new Experiment(
			SVG("prison-interactive-" + suffix),
			numPrisoners,
			startStateFn,
			graphicsFn,
		);
		this.nextButton = document.getElementById("next-button-" + suffix) as HTMLButtonElement;
		this.undoButton = document.getElementById("undo-button-" + suffix) as HTMLButtonElement;
		this.finishPhaseButton = document.getElementById("finish-phase-button-" + suffix) as HTMLButtonElement;
		this.startOverButton = document.getElementById("start-over-button-" + suffix) as HTMLButtonElement;
		this.dayCounter = document.getElementById("day-counter-" + suffix)!;
		this.stateText = document.getElementById("state-description-" + suffix)!;

		this.nextButton.addEventListener("click", event => {
			let currentPhase = this.experiment.prisoners[0].state.phase;
			if (currentPhase == "final") {
				return;
			}

			this.experiment.advance();
			this.drawEverything();
		});

		this.finishPhaseButton.addEventListener("click", event => {
			let currentPhase = this.experiment.prisoners[0].state.phase;
			if (currentPhase == "final") {
				return;
			}

			while (this.experiment.prisoners[0].state.phase == currentPhase) {
				this.experiment.advance();
				this.drawEverything();
			}
		});

		this.undoButton.addEventListener("click", event => {
			this.experiment.undo();
			this.drawEverything();
		});

		this.startOverButton.addEventListener("click", event => {
			this.experiment.startOver();
			this.drawEverything();
		});
	}

	drawEverything() {
		this.experiment.draw();
		let time = this.experiment.state.state == "A" ? "Day" : "Night";
		this.dayCounter.textContent = `${time} ${this.experiment.numDays}`
		this.stateText.textContent = this.experiment.currentState();
	}
}

// Create experiments and link them to the HTML visuals
let experiment1 = new ExperimentApplet<SimpleState>(5, "1", startState, (drawing, name) => new SimpleGraphics(drawing, name));
let experiment2 = new ExperimentApplet(5, "2", startStateFancy, (drawing, name) => new FancyGraphics(drawing, name));

experiment1.drawEverything();
experiment2.drawEverything();
