/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 536:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.SvgHydra = exports.SvgHeadData = exports.TreeLayout = exports.HydraSkeleton = exports.CLONE_COLOR = exports.NECK_WIDTH = exports.LEVEL_SPACING = exports.NODE_SPACING = exports.NODE_DIAM = void 0;
// Constants
exports.NODE_DIAM = 0.5;
exports.NODE_SPACING = 1;
exports.LEVEL_SPACING = 2;
exports.NECK_WIDTH = 0.1;
exports.CLONE_COLOR = "#422aa8";
var tree_1 = __webpack_require__(347);
/* Hydra Structure */
var HydraSkeleton = /** @class */ (function () {
    function HydraSkeleton(children) {
        this.tree = new tree_1.Tree(null, children.map(function (child) { return child.tree; }));
    }
    return HydraSkeleton;
}());
exports.HydraSkeleton = HydraSkeleton;
// The algorithm here is cribbed from: https://llimllib.github.io/pymag-trees/
var TreeLayout = /** @class */ (function () {
    function TreeLayout(x, y, children) {
        this.tree = new tree_1.Tree({ x: x, y: y }, children.map(function (child) { return child.tree; }));
    }
    TreeLayout.fromTree = function (tree) {
        // If we have no children, we have an easy base case
        if (tree.children.length === 0) {
            return new TreeLayout(0, 0, []);
        }
        // Recursively build the layouts for our children, shifted down
        // by one, and spaced out minimally horizontally.
        var childLayouts = tree.children.map(function (child, idx) {
            var layout = TreeLayout.fromTree(child);
            layout.shift(idx, 1);
            return layout;
        });
        // Now, starting with the leftmost child, check for conflicts with
        // its leftward siblings.
        for (var i = 0; i < childLayouts.length; i++) {
            for (var j = i - 1; j >= 0; j--) {
                var leftContour = childLayouts[i].leftContour();
                var rightContour = childLayouts[j].rightContour();
                // Find the gap between the two contours (possibly negative!).
                var minLength = Math.min(leftContour.length, rightContour.length);
                var idealGap = 1;
                var gap = idealGap;
                for (var k = 0; k < minLength; k++) {
                    gap = Math.min(gap, leftContour[k] - rightContour[k]);
                }
                // If it's large enough, continue to the next sibling. Otherwise,
                // adjust our positions, dragging intermediate nodes along with us.
                if (gap >= idealGap) {
                    continue;
                }
                // We are #i, the collision is with node #j, so there are 
                // (i - j - 1) nodes in between us, and we also move ourselves,
                // so there's i - j nodes to move.
                var totalShift = idealGap - gap;
                var numGaps = i - j;
                for (var k = 1; k <= numGaps; k++) {
                    childLayouts[j + k].shift(totalShift * k / numGaps, 0);
                }
            }
        }
        // Lastly, we center our children under ourselves
        var minX = childLayouts[0].tree.payload.x;
        var maxX = childLayouts[childLayouts.length - 1].tree.payload.x;
        var center = (minX + maxX) / 2;
        childLayouts.forEach(function (child) { return child.shift(-center, 0); });
        return new TreeLayout(0, 0, childLayouts);
    };
    TreeLayout.prototype.shift = function (dx, dy) {
        this.tree.forEachPreorder(function (t) { t.x += dx; t.y += dy; });
    };
    // The left contour is an array where the ith element is the x-position of the leftmost
    // node on the ith level. Similarly, the right contour is the x-position of the rightmost
    // node on that level.
    TreeLayout.prototype._contour = function (kind) {
        // Captured by the function below and modified.
        var contour = [];
        this.tree.forEachPreorder(function (node, depth) {
            var newX = node.x;
            if (depth < contour.length) {
                // Compare ourselves to the existing contour, and update if necessary
                var oldX = contour[depth];
                if (kind == "left" && newX < oldX || kind == "right" && newX > oldX) {
                    contour[depth] = newX;
                }
            }
            else {
                contour.push(newX);
            }
        });
        return contour;
    };
    TreeLayout.prototype.leftContour = function () {
        return this._contour("left");
    };
    TreeLayout.prototype.rightContour = function () {
        return this._contour("right");
    };
    TreeLayout.prototype.getMinX = function () {
        return Math.min.apply(Math, __spreadArray([], __read(this.leftContour()), false));
    };
    TreeLayout.prototype.getMaxX = function () {
        return Math.max.apply(Math, __spreadArray([], __read(this.rightContour()), false));
    };
    TreeLayout.prototype.getWidth = function () {
        return this.getMaxX() - this.getMinX();
    };
    return TreeLayout;
}());
exports.TreeLayout = TreeLayout;
var SvgHeadData = /** @class */ (function () {
    function SvgHeadData(group, neck) {
        this.head = group.circle(exports.NODE_DIAM);
        if (neck) {
            this.neck = group.line([0, 0, 0, 0]).stroke({ width: exports.NECK_WIDTH });
            this.neck.back(); // put it behind head
        }
        else {
            this.neck = null;
        }
    }
    return SvgHeadData;
}());
exports.SvgHeadData = SvgHeadData;
var SvgHydra = /** @class */ (function () {
    function SvgHydra(drawing, skeleton) {
        this.svgGroup = drawing.group();
        this.svgTree = this.createSvgHeads(skeleton.tree);
    }
    SvgHydra.prototype.createSvgHeads = function (tree) {
        var _this = this;
        return tree.mapX(function (node) { return new SvgHeadData(_this.svgGroup, node.parent !== null); });
    };
    SvgHydra.prototype.repositionNodes = function () {
        var layout = TreeLayout.fromTree(this.svgTree);
        layout.shift(-layout.getMinX(), 0);
        this.svgTree.zip(layout.tree).forEachPreorderX(function (node) {
            var _a;
            var parent = node.parent;
            var _b = __read(node.payload, 2), svgData = _b[0], position = _b[1];
            svgData.head.center(position.y * exports.LEVEL_SPACING, position.x * exports.NODE_SPACING);
            if (parent !== null) {
                var parentPosition = parent.payload[1];
                (_a = svgData.neck) === null || _a === void 0 ? void 0 : _a.plot(position.y * exports.LEVEL_SPACING, position.x * exports.NODE_SPACING, parentPosition.y * exports.LEVEL_SPACING, parentPosition.x * exports.NODE_SPACING);
            }
        });
    };
    SvgHydra.prototype.index = function () {
        var _a;
        var _b, _c;
        var idxs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            idxs[_i] = arguments[_i];
        }
        return (_c = (_b = (_a = this.svgTree).index.apply(_a, __spreadArray([], __read(idxs), false))) === null || _b === void 0 ? void 0 : _b.payload) !== null && _c !== void 0 ? _c : null;
    };
    SvgHydra.prototype.root = function () {
        return this.svgTree.payload;
    };
    return SvgHydra;
}());
exports.SvgHydra = SvgHydra;
//# sourceMappingURL=hydra.js.map

/***/ }),

/***/ 347:
/***/ (function(__unused_webpack_module, exports) {


var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Tree = void 0;
var Tree = /** @class */ (function () {
    function Tree(payload, children) {
        var _this = this;
        this.parent = null;
        this.children = children;
        this.payload = payload;
        children.forEach(function (child) { return child.parent = _this; });
    }
    Tree.prototype.index = function () {
        var _a;
        var idxs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            idxs[_i] = arguments[_i];
        }
        if (idxs.length === 0) {
            return this;
        }
        var i = idxs[0];
        if (i < this.children.length) {
            return (_a = this.children[i]).index.apply(_a, __spreadArray([], __read(idxs.slice(1)), false));
        }
        else {
            return null;
        }
    };
    Tree.prototype.makeCopy = function () {
        // The copy is not attached to the parent!
        return new Tree(this.payload, this.children.map(function (child) { return child.makeCopy(); }));
    };
    Tree.prototype.insertSubtree = function (idx, subtree) {
        this.children.splice(idx, 0, subtree);
        subtree.parent = this;
    };
    Tree.prototype.appendChild = function (payload) {
        var child = new Tree(payload, []);
        child.parent = this;
        this.children.push(child);
        return child;
    };
    Tree.prototype.remove = function () {
        // Calling this on the root does nothing
        var parent = this.parent;
        if (parent !== null) {
            var idx = parent.children.indexOf(this);
            parent.children.splice(idx, 1);
            this.parent = null;
        }
    };
    // TODO: decide if i want the X versions or not
    Tree.prototype.forEachPreorder = function (fn, depth) {
        if (depth === void 0) { depth = 0; }
        fn(this.payload, depth);
        this.children.forEach(function (child) { return child.forEachPreorder(fn, depth + 1); });
    };
    Tree.prototype.forEachPreorderX = function (fn, depth) {
        if (depth === void 0) { depth = 0; }
        fn(this, depth);
        this.children.forEach(function (child) { return child.forEachPreorderX(fn, depth + 1); });
    };
    Tree.prototype.zip = function (other) {
        var children = [];
        var n = Math.min(this.children.length, other.children.length);
        for (var i = 0; i < n; i++) {
            children.push(this.children[i].zip(other.children[i]));
        }
        return new Tree([this.payload, other.payload], children);
    };
    Tree.prototype.zipX = function (other) {
        var children = [];
        var n = Math.min(this.children.length, other.children.length);
        for (var i = 0; i < n; i++) {
            children.push(this.children[i].zipX(other.children[i]));
        }
        return new Tree([this, other], children);
    };
    Tree.prototype.map = function (fn) {
        return new Tree(fn(this.payload), this.children.map(function (child) { return child.map(fn); }));
    };
    Tree.prototype.mapX = function (fn) {
        return new Tree(fn(this), this.children.map(function (child) { return child.mapX(fn); }));
    };
    return Tree;
}());
exports.Tree = Tree;
//# sourceMappingURL=tree.js.map

/***/ }),

/***/ 130:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


"use_strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
exports.__esModule = true;
var hydra_1 = __webpack_require__(536);
var V_PADDING = 0.7;
var H_PADDING = 0.5;
var DIE_DURATION = 500;
var MOVE_DURATION = 700;
var CLONE_DURATION = 200;
var resetButton = document.getElementById("reset-button");
var clickCounter = document.getElementById("click-counter");
// @ts-ignore
var drawing = SVG("hydra-interactive"); // really an svg.js element
// Keeps track of number of clicks
var numClicks = 0;
function updateCounter() {
    clickCounter.textContent = "Clicks: " + numClicks;
    numClicks += 1;
}
// Recreates and redraws the hydra
function resetHydra() {
    // Clear existing state
    drawing.clear();
    numClicks = 0;
    updateCounter();
    // Create the original hydra
    var hydra = new hydra_1.HydraSkeleton([]);
    var child = hydra.tree.appendChild(null);
    var gchild = child.appendChild(null);
    gchild.appendChild(null);
    gchild.appendChild(null);
    // Then draw it
    var svgHydra = new hydra_1.SvgHydra(drawing, hydra);
    svgHydra.repositionNodes();
    resizeViewbox(drawing, hydra_1.TreeLayout.fromTree(svgHydra.svgTree));
    // Lastly, hook up the listeners
    setListeners(drawing, svgHydra, svgHydra.svgTree, updateCounter);
}
function resizeViewbox(drawing, layout) {
    var boxWidth = 3 * hydra_1.LEVEL_SPACING;
    var boxHeight = layout.getWidth() * hydra_1.NODE_SPACING;
    drawing.viewbox(-(H_PADDING + hydra_1.NODE_DIAM / 2), -(V_PADDING + hydra_1.NODE_DIAM / 2), boxWidth + 2 * H_PADDING + hydra_1.NODE_DIAM, boxHeight + 2 * V_PADDING + hydra_1.NODE_DIAM);
}
function setListeners(drawing, hydra, node, clickCallback) {
    // Data passed between callbacks
    var wasClicked = false;
    var opacityGroup;
    var svgHead = node.payload;
    // We've got a sequence of animation callbacks
    function cut() {
        // Return immediately if we should ignore the click
        if (node.parent === null || node.children.length !== 0) {
            return;
        }
        // Increment counter
        wasClicked = true;
        clickCallback();
        // Opacity has to be controlled as a group or else the overlap causes
        // problems. But make sure to kill the group later.
        opacityGroup = drawing.group().add(svgHead.neck).add(svgHead.head);
        // @ts-ignore
        opacityGroup.animate(DIE_DURATION, ">", 0).opacity(0).afterAll(cut2);
    }
    function cut2() {
        var parent = node.parent;
        // Delete the head that is killed
        opacityGroup.remove();
        node.remove();
        // Our parent should clone itself, unless it's root
        var grandparent = parent.parent;
        if (grandparent === null) {
            cut3(); // call immediately
            return;
        }
        // Generate the new uncles and cousins
        var parentIdx = grandparent.children.indexOf(parent);
        var copies = [];
        for (var i = 0; i < 2; i++) {
            // Make a copy of the parent (nulling out the payloads),
            // and use it to create new svg data.
            // TODO: since that tree doesn't have a parent yet, I have to
            // manually create the line. That seems dumb.
            var copy = hydra.createSvgHeads(parent.map(function (_) { return null; }));
            copy.payload.neck = hydra.svgGroup.line([0, 0, 0, 0]).stroke({ width: hydra_1.NECK_WIDTH });
            copy.payload.neck.back();
            grandparent.insertSubtree(parentIdx + 1, copy);
            // Attach listeners to the new SVG elements
            setListeners(drawing, hydra, copy, clickCallback);
            // Lastly, position the copy on top of the parent
            parent.zip(copy).forEachPreorder(function (_a) {
                var _b;
                var _c = __read(_a, 2), data1 = _c[0], data2 = _c[1];
                data2.head.move(data1.head.x(), data1.head.y());
                (_b = data2.neck) === null || _b === void 0 ? void 0 : _b.plot(data1.neck.array());
            });
            copies.push(copy);
        }
        // Lastly, make everyone involved blue.
        copies.forEach(function (copy) { return makeBlue(copy); });
        // @ts-ignore
        makeBlue(parent).afterAll(cut3);
    }
    function cut3() {
        // Layout the tree again, and move everything to its final position
        var layout = hydra_1.TreeLayout.fromTree(hydra.svgTree);
        layout.shift(-layout.getMinX(), 0);
        hydra.svgTree.zip(layout.tree).forEachPreorderX(function (node) {
            var _a;
            var svgHead = node.payload[0];
            var position = node.payload[1];
            var headAnim = svgHead.head.animate(MOVE_DURATION, "<", 0);
            // @ts-ignore
            headAnim.center(position.y * hydra_1.LEVEL_SPACING, position.x * hydra_1.NODE_SPACING).fill("#000");
            if (node.parent !== null) {
                var prevPosition = node.parent.payload[1];
                var neckAnim = (_a = svgHead.neck) === null || _a === void 0 ? void 0 : _a.animate(MOVE_DURATION, "<", 0);
                // @ts-ignore
                neckAnim.plot(position.y * hydra_1.LEVEL_SPACING, position.x * hydra_1.NODE_SPACING, prevPosition.y * hydra_1.LEVEL_SPACING, prevPosition.x * hydra_1.NODE_SPACING).stroke("#000");
            }
        });
        resizeViewbox(
        // @ts-ignore
        drawing.animate(MOVE_DURATION, "<", 0), layout);
        cut4();
    }
    function cut4() {
        if (hydra.svgTree.children.length === 0) {
            alert("Wow... I can't believe you actually did it!\n" +
                "Sorry I didn't write anything cool for you yet. " +
                "Perhaps I'll add something later.");
        }
    }
    // helper function
    // this needs to do the recursion manually for now, so that we return the final animation
    // and use it for afterAll callbacks
    function makeBlue(h) {
        // Recurse
        h.children.forEach(function (child) { return makeBlue(child); });
        var svgHead = h.payload;
        if (svgHead.neck !== null) {
            // @ts-ignore
            svgHead.neck.animate(CLONE_DURATION, "<", 0).stroke(hydra_1.CLONE_COLOR);
        }
        // @ts-ignore
        return svgHead.head.animate(CLONE_DURATION, "<", 0).fill(hydra_1.CLONE_COLOR);
    }
    // Finally, now that everything's defined, assign the click handler
    // to self, and recurse to children.
    svgHead.head.click(cut);
    node.children.forEach(function (child) { return setListeners(drawing, hydra, child, clickCallback); });
}
resetHydra(); // init hydra
resetButton.addEventListener("click", resetHydra);
//# sourceMappingURL=hydra.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(130);
/******/ 	
/******/ })()
;