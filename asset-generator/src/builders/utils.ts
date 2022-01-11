"use strict;"

import fs = require('fs');
// @ts-ignore
import svgdom = require('svgdom');
import TextToSVG = require('text-to-svg');
import type { svgjs } from "svg.js";

//--------------------------------
// Nonsense for setting up modules
//--------------------------------

function once_only<T>(fn: () => T) {
	var called = false;
	var result: T;
	return function (): T {
		if (!called) {
			called = true;
			result = fn();
		}
		return result;
	}
}

// Initialize MathJax
declare var MathJax: any;
(function (): any {
	const PACKAGES = 'base, autoload, require, ams, newcommand';
	// @ts-ignore
	global.MathJax = {
		tex: { packages: PACKAGES.split(/\s*,\s*/) },
		svg: { fontCache: 'local' },
		startup: { typeset: false }
	};

	require('mathjax/es5/startup.js');
	require('mathjax/es5/core.js');
	require('mathjax/es5/adaptors/liteDOM.js');
	require('mathjax/es5/input/tex-base.js');
	require('mathjax/es5/input/tex/extensions/all-packages.js');
	require('mathjax/es5/output/svg.js');
	require('mathjax/es5/output/svg/fonts/tex.js');

	MathJax.loader.preLoad(
		'core',
		'adaptors/liteDOM',
		'input/tex-base',
		'[tex]/all-packages',
		'output/svg',
		'output/svg/fonts/tex'
	);

	MathJax.config.startup.ready();
})();

// private global for svgdom's window
var svgdom_window = svgdom.createSVGWindow();

// Set up a fake DOM with a single SVG element at the root
var SVG: svgjs.Library = require('svg.js')(svgdom_window);

var createCanvas = once_only(function (): svgjs.Container {
	return SVG(svgdom_window.document.documentElement);
});

//--------------------------------
// SVG helper methods
//--------------------------------

export function loadFont(fontPath: string): TextToSVG {
	return TextToSVG.loadSync(fontPath);
}

function scaleFromOrigin(svgObj: svgjs.Shape, scaleFactor: number): void {
	// Oftentimes, mostly for text, we want to scale from the origin, not from
	// the upper-left corner. So we do it here.
	svgObj.size(svgObj.width() * scaleFactor, svgObj.height() * scaleFactor);

	// We know where the upper-left corner of the bbox should be, because
	// scaling from the origin is easy. So let's move the object there.
	svgObj.move(svgObj.x() * scaleFactor, svgObj.y() * scaleFactor);
}

export function makeTextPath(canvas: svgjs.Container, fontObj: TextToSVG, text: string, fontSizePx: number): svgjs.Path {
	// 72 is big enough to render crisply
	var path = canvas.path(fontObj.getD(text, { fontSize: 72 }));

	// The text is created with the start of the baseline at the origin, so
	// we use scaleFromOrigin, and not size().
	var scaleFactor = fontSizePx / 72;
	scaleFromOrigin(path, scaleFactor);

	// TODO there's still some weird leading space at the beginning?

	return path;
}

export function makeMathSvg(canvas: svgjs.Container, tex: string, fontSizePx: number): svgjs.Element {
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

export function shrinkCanvas(canvas: svgjs.Container, margin: number = 0): void {
	// Computes bounding box over all elements in the canvas, and resizes the
	// viewbox to fit it.
	var box: svgjs.Box = canvas.bbox();

	function merge(element: svgjs.Element) {
		// Explicitly exclude defs, because they're not really in the doc
		if (element.type == 'defs') {
			return;
		}
		// SVG.js creates an zero-opacity SVG.js for 'parsing'; we want to omit
		// this from our calculations
		// @ts-ignore
		if (element.type === "svg" && element.style("opacity") === "0") {
			return;
		}
		if (element instanceof SVG.Shape && element.visible()) {
			box = box.merge(element.rbox(canvas));
		}
		if (element instanceof SVG.Container) {
			(element as svgjs.Container).children().forEach(merge);
		}
	}

	merge(canvas);
	canvas.viewbox(
		box.x - margin, box.y - margin, box.w + 2 * margin, box.h + 2 * margin
	);
}

export function adjustCanvas(canvas: svgjs.Container, left: number, right: number, top: number, bottom: number) {
	var viewbox = canvas.viewbox();
	canvas.viewbox(
		viewbox.x - left, viewbox.y - top,
		viewbox.width + left + right, viewbox.height + top + bottom
	);
}

function saveImgToFile(canvas: svgjs.Container, filename: string, highlightBackground: boolean = false) {
	if (highlightBackground) {
		var bbox = canvas.viewbox();
		canvas.rect(bbox.width, bbox.height).move(bbox.x, bbox.y).back().fill("#ffff00");
	}

	// clear the parser object (can't delete it or it'll confuse SVG.js)
	// @ts-ignore
	var parser = SVG.parser;
	parser.path.instance.attr("d", "");
	parser.poly.instance.attr("points", "");

	fs.writeFileSync(filename, canvas.svg());
}

type AssetFn = (canvas: svgjs.Container) => void;

export class Builder {
	assets: [AssetFn, string][];

	constructor() {
		this.assets = [];
	}

	register(filename: string, fn: AssetFn) {
		this.assets.push([fn, filename]);
	}

	generateAll() {
		for (let [fn, filename] of this.assets) {
			// TODO fold the clear canvas logic into here?
			// Get the global canvas instance
			let canvas = createCanvas();

			fn(canvas);
			saveImgToFile(canvas, filename);

			// Clear the canvas for the next function
			canvas.clear();
			SVG.did = 1005;  // parser is 1003, parser path is 1004
		}
	}
}