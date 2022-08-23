"use strict";

import fs = require('fs');
import path = require('path');
import { FILE_CONFIG } from "./config";
import { getSVGCanvas } from "./init";
import * as SVG from "@svgdotjs/svg.js";

type DrawFn = (canvas: SVG.Container) => void;

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
            let canvas = getSVGCanvas();

            // Draw on the canvas
            drawFunction(canvas);

            // Save the canvas to a file
            let fullPath = path.join(FILE_CONFIG.IMAGES, this.rootPath, filename);
            fs.mkdirSync(path.dirname(fullPath), {recursive: true});
            fs.writeFileSync(fullPath, sanitizeSvg(canvas.svg()));

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

	let tags = splitIntoTags(svg);
	return formatTags(tags);
}