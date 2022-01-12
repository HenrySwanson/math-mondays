"use strict";

import fs = require('fs');
import { createCanvas } from "./utils";

type DrawFn = (canvas: svgjs.Container) => void;

export class Builder {
    assets: [DrawFn, string][];
    rootPath: string;

    constructor(rootPath: string) {
        this.assets = [];
        this.rootPath = rootPath;
    }

    register(filename: string, drawFunction: DrawFn) {
        this.assets.push([drawFunction, filename]);
    }

    generateAll() {
        for (let [drawFunction, filename] of this.assets) {
            // Get the global canvas instance
            let canvas = createCanvas();

            // Draw on the canvas
            drawFunction(canvas);

            // Save the canvas to a file
            fs.writeFileSync(this.rootPath + "/" + filename, sanitizeSvg(canvas.svg()));

            // Clear the canvas for the next function
            canvas.clear();
        }
    }
}

function sanitizeSvg(svg: string): string {
	// We do some quick parsing in order to pretty-print things and swap out the IDs

	function splitIntoTags(svg: string) {
		let tags = [];

		let i = 0;
		while (true) {
			let j = svg.indexOf(">", i);
			if (j === -1) {
				break;
			}
			tags.push(svg.slice(i, j + 1));
			i = j + 1;
		}
		return tags;
	}

	// TODO use Tree<T> here?
	function formatTags(tags: string[]): string {
		let output = "";
		let indentLevel = 0;
		let prevWasOpen = false;
		for (let tag of tags) {
			let isEndTag = tag.startsWith("</");
			let sameLine = isEndTag && prevWasOpen;

			if (isEndTag) {
				indentLevel--;
			}

			if (sameLine) {
				output += tag;
			} else {
				output += "\r\n" + " ".repeat(indentLevel) + tag;
			}

			if (!isEndTag) {
				indentLevel++;
			}

			prevWasOpen = !isEndTag;
		}
		return output;
	}

	function extractIds(tags: string[]): string[] {
		let idRegex = /id="([^\"]*)"/;
		let ids: string[] = [];

		for (let tag of tags) {
			let match = idRegex.exec(tag);
			if (match !== null) {
				ids.push(match[1]);
			}
		}

		return ids;
	}

	function generateNewIds(oldIds: string[]): Map<string, string> {
		let svgjsRegex = /Svgjs(\w+?)\d+/
		let idMap = new Map<string, string>();
		let counters = new Map<string, number>();

		for (let oldId of oldIds) {
			// Skip any ids we've seen before
			if (idMap.has(oldId)) {
				continue;
			}

			// Find the right prefix for this id
			let type = null;

			let x = svgjsRegex.exec(oldId);
			if (x !== null) {
				type = x[1].toLowerCase();
			} else if (oldId.startsWith("MJX-")) {
				type = "mathjax";
			}

			if (type !== null) {
				// Get and increment counter
				if (!counters.has(type)) {
					counters.set(type, 1);
				}
				let counter = counters.get(type)!;
				counters.set(type, counter + 1);

				let newId = type + "-" + counter;
				idMap.set(oldId, newId);
			} else {
				// TODO maybe just don't even include this
				idMap.set(oldId, oldId);  // no change
			}
		}

		return idMap;
	}

	function replaceIds(tag: string, idMap: Map<string, string>): string {
		for (let [oldId, newId] of Array.from(idMap.entries())) {
			tag = tag.replace(oldId, newId);
		}
		return tag;
	}

	let tags = splitIntoTags(svg);

	// Remove parser section
	let parserStartIdx = tags.findIndex(tag => tag.startsWith("<svg") && tag.includes("focusable=\"false\""));
	let parserEndIdx = parserStartIdx + tags.slice(parserStartIdx).findIndex(tag => tag.startsWith("</svg"));
	tags.splice(parserStartIdx, parserEndIdx - parserStartIdx + 1);

	let idMap = generateNewIds(extractIds(tags));

	// Now actually do the replacement
	tags = tags.map(tag => replaceIds(tag, idMap));
	return formatTags(tags);
}