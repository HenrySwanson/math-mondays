"use strict";

// @ts-ignore
import { createSVGWindow } from 'svgdom';
import * as SVG from "@svgdotjs/svg.js";

// This file contains methods setting up external libraries for builder/.
// In website/, the same libraries will be provided externally, fetched from
// some CDN in a separate script.

function memoize_forever<T>(fn: () => T) {
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
// Adapted from https://github.com/mathjax/MathJax-demos-node/blob/master/preload/tex2svg
declare global { var MathJax: any; }
export let MathJax = (function (): any {
    const PACKAGES = 'base, autoload, require, ams, newcommand';
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

    global.MathJax.loader.preLoad(
        'core',
        'adaptors/liteDOM',
        'input/tex-base',
        '[tex]/all-packages',
        'output/svg',
        'output/svg/fonts/tex'
    );

    global.MathJax.config.startup.ready();

    return global.MathJax;
})();

export let getSVGCanvas = memoize_forever(function (): SVG.Container {
    // only runs once due to memoize
    let window = createSVGWindow();
    let document = window.document;
    SVG.registerWindow(window, document);
    // @ts-ignore
    return SVG.SVG(document.documentElement);
});