"use strict;"

import { MathJax } from './init';
import { FILE_CONFIG } from "./config";
import path = require('path');
import TextToSVG = require('text-to-svg');
import * as SVG from "@svgdotjs/svg.js";
import { strict as assert } from 'assert';

export function loadFont(fontPath: string): TextToSVG {
	return TextToSVG.loadSync(path.join(FILE_CONFIG.FONTS, fontPath));
}

function pushdownTransformation(container: SVG.Container) {
	/// This function removes the transformation from the container,
	/// and pushes it down to the children.

	let t = container.transform();

	for (let child of container.children()) {
	// 	const ctm = child.screenCTM();
	// 	const pCtm = container.screenCTM().inverse();
		
	// 	child.untransform().transform(pCtm.multiply(ctm));
		// child.transform(t, true);
	}
	container.untransform();

	// const ctm = elt.screenCTM();
	// const pCtm = parent.screenCTM().inverse();
	
	// elt.untransform().transform(pCtm.multiply(ctm));
}

function scaleFromOrigin(svgObj: SVG.Shape, scaleFactor: number): void {
	// TODO: can this be replaced with
	//mathSvg.scale(scaleFactor);
	// pushdownTransformation(mathSvg);

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

	assert.equal(node.children.length, 1);
	let svgText = adaptor.outerHTML(node.children[0]);

	// Import new nested SVG element to the canvas. The svg() method returns
	// the parent object, so we fetch the new object by the last element.
	let mathSvg = canvas.svg(svgText).last() as SVG.Svg;

	// Unfortunately, MathJax outputs units of ex, but we'd rather use non-relative
	// units. Fortunately, MathJaX will give us the conversion factor.
	let metrics = MathJax.getMetricsFor(node, true);

	function convertExToPx(length: SVG.NumberAlias): number {
		// @ts-ignore: This should work but I think it's a TS bug
		let lengthEx = new SVG.Number(length);
		if (lengthEx.value !== 0) {
			assert.equal(lengthEx.unit, "ex", lengthEx.toString());
		}
		return lengthEx.value * metrics.ex / metrics.scale;
	}

	// Now we change the units to px (this should not change the visual size).
	let widthPx = convertExToPx(mathSvg.width());
	let heightPx = convertExToPx(mathSvg.height());
	mathSvg.size(widthPx, heightPx);

	// Currently, the origin is at the upper-left corner, but we want to put it at
	// the left-most edge of the baseline.
	// So we want to raise it by the height, and then by vertical-align (which is
	// usually negative). And this must be done in pixels.

	// To get the vertical-align, we extract it from the style property.
	// @ts-ignore: If I passed `verticalAlign` it'd typecheck, but not work...
	let verticalAlignEx: string = mathSvg.css("vertical-align").toString();
	let verticalAlignPx = convertExToPx(verticalAlignEx);

	// Then we move it to the right position.
	mathSvg.dy(- heightPx - verticalAlignPx);

	// Now we scale it to the desired height. The font size is always 1em,
	// by definition, so we convert it to pixels and put it in the denominator.
	let scaleFactor = fontSizePx / (metrics.em / metrics.scale);
	scaleFromOrigin(mathSvg, scaleFactor);

	// Lastly, clear the style element so it can't interfere with us
	mathSvg.attr("style", null);

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