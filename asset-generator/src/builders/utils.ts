"use strict;"

import { MathJax } from './init';
import { FILE_CONFIG } from "./config";
import path = require('path');
import TextToSVG = require('text-to-svg');
import * as SVG from "@svgdotjs/svg.js";

export function loadFont(fontPath: string): TextToSVG {
	return TextToSVG.loadSync(path.join(FILE_CONFIG.FONTS, fontPath));
}

function scaleFromOrigin(svgObj: SVG.Shape, scaleFactor: number): void {
	// svgObj.scale(scaleFactor);
	// TODO: what the hell is this NumberAlias thing?

	// Oftentimes, mostly for text, we want to scale from the origin, not from
	// the upper-left corner. So we do it here.
	svgObj.size(svgObj.width() as number * scaleFactor, svgObj.height() as number * scaleFactor);

	// We know where the upper-left corner of the bbox should be, because
	// scaling from the origin is easy. So let's move the object there.
	svgObj.move(svgObj.x() as number * scaleFactor, svgObj.y() as number * scaleFactor);
}

export function makeTextPath(canvas: SVG.Container, fontObj: TextToSVG, text: string, fontSizePx: number): SVG.Path {
	// 72 is big enough to render crisply
	var path = canvas.path(fontObj.getD(text, { fontSize: 72 }));

	// The text is created with the start of the baseline at the origin, so
	// we use scaleFromOrigin, and not size().
	var scaleFactor = fontSizePx / 72;
	scaleFromOrigin(path, scaleFactor);

	// TODO there's still some weird leading space at the beginning?

	return path;
}

export function makeMathSvg(canvas: SVG.Container, tex: string, fontSizePx: number): SVG.Element {
	// Returns some math text with the baseline at the origin.
	const adaptor = MathJax.startup.adaptor;
	const node = MathJax.tex2svg(tex, { display: true });
	var svgText = adaptor.outerHTML(node.children[0]);
	canvas.svg(svgText);  // add inner SVG element to the canvas

	// get the last element, which is our svg object
	var mathSvg = canvas.last();

	// Unfortunately, MathJax outputs units of ex, but that's not compatible
	// with svg.js. Fortunately, we can ask it for its context.
	var metrics = MathJax.getMetricsFor(node, true);
	var exToPx = metrics.ex / metrics.scale;

	// Note: despite the typestub, in this case mathSvg.height() returns a string
	// like 20.5ex. So we have to strip off the unit ourselves, eluding the typechecker.
	// @ts-ignore
	var widthEx = +mathSvg.width().slice(0, -2);
	// @ts-ignore
	var heightEx = +mathSvg.height().slice(0, -2);

	// Now we change the units to px (this should not change the visual size).
	mathSvg.size(widthEx * exToPx, heightEx * exToPx);

	// Next, we shift it so that the baseline is at zero. To do this, we have to
	// inspect the "style" property of the object; specifically, the property
	// vertical-align. Fortunately, that should be the only thing in there.
	var regex = /vertical-align: *(-?\d*\.?\d*)(ex)?/
	var verticalAlignEx = +regex.exec(mathSvg.attr("style"))![1];

	// Currently the upper-left corner is at the origin, so we want to raise it
	// by the height, and then by vertical-align. But this all has to be done
	// in units of px, not ex.
	mathSvg.dy(-exToPx * (heightEx + verticalAlignEx));

	// Now the baseline is at the origin, so let's scale from the origin. The font
	// is, by default, 1 em tall, so that's what we put in our denominator.
	var scaleFactor = fontSizePx / metrics.em * metrics.scale;
	scaleFromOrigin(mathSvg, scaleFactor);

	// Lastly, clear the style element so it can't interfere with us
	mathSvg.attr("style", "");

	return mathSvg;
}

//--------------------------------
// Saving images to file
//--------------------------------

export function shrinkCanvas(canvas: SVG.Container, margin: number = 0): void {
	// Computes bounding box over all elements in the canvas, and resizes the
	// viewbox to fit it, plus an additional margin.

	let box = canvas.bbox();
	canvas.viewbox(
		box.x - margin, box.y - margin, box.w + 2 * margin, box.h + 2 * margin
	);
}

export function adjustCanvas(canvas: SVG.Container, left: number, right: number, top: number, bottom: number) {
	var viewbox = canvas.viewbox();
	canvas.viewbox(
		viewbox.x - left, viewbox.y - top,
		viewbox.width + left + right, viewbox.height + top + bottom
	);
}