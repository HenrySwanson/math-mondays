/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 353:
/***/ ((__unused_webpack_module, exports) => {


exports.__esModule = true;
exports.Announcement = exports.WaningPhase = exports.WaxingPhase = void 0;
// Common Subprocedures
var WaxingPhase = /** @class */ (function () {
    function WaxingPhase(captain, round, day, active) {
        this.phase = "waxing";
        this.captain = captain;
        this.round = round;
        this.day = day;
        this.active = active;
    }
    WaxingPhase.prototype.next = function (t) {
        var active = this.active || t;
        if (this.day < this.round) {
            return { done: false, value: new WaxingPhase(this.captain, this.round, this.day + 1, active) };
        }
        else {
            return { done: false, value: new WaningPhase(this.captain, this.round, 1, active) };
        }
    };
    return WaxingPhase;
}());
exports.WaxingPhase = WaxingPhase;
var WaningPhase = /** @class */ (function () {
    function WaningPhase(captain, round, day, active) {
        this.phase = "waning";
        this.captain = captain;
        this.round = round;
        this.day = day;
        this.active = active;
    }
    WaningPhase.prototype.next = function (t) {
        var active = this.active && t;
        if (this.day < Math.pow(2, this.round)) {
            return { done: false, value: new WaningPhase(this.captain, this.round, this.day + 1, active) };
        }
        else if (!active) {
            return { done: false, value: new WaxingPhase(this.captain, this.round + 1, 1, this.captain) };
        }
        else {
            return { done: true, value: Math.pow(2, this.round) };
        }
    };
    return WaningPhase;
}());
exports.WaningPhase = WaningPhase;
var Announcement = /** @class */ (function () {
    function Announcement(active, numDays, day) {
        this.active = active;
        this.numDays = numDays;
        this.day = day;
    }
    Announcement.prototype.next = function (t) {
        var active = this.active || t;
        if (this.day < this.numDays) {
            return { done: false, value: new Announcement(active, this.numDays, this.day + 1) };
        }
        else {
            return { done: true, value: active };
        }
    };
    return Announcement;
}());
exports.Announcement = Announcement;
//# sourceMappingURL=common.js.map

/***/ }),

/***/ 77:
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
exports.__esModule = true;
exports.Graphics = exports.startState = void 0;
var common_1 = __webpack_require__(353);
var ACTIVE_COLOR = "#ffff00";
var WANING_COLOR = "#ffcc00";
var INACTIVE_COLOR = "#808080";
var CANDIDATE_COLOR = "#00ffff";
var BORDER_COLOR = "#000000";
var PRISONER_RADIUS = 20;
var PRISONER_SPACING = 80;
var COIN_DIAMETER = 10;
var SWITCH_HEIGHT = 30;
var SWITCH_WIDTH = 15;
function startState(captain) {
    return UpperBoundPhase.start(captain);
}
exports.startState = startState;
var UpperBoundPhase = /** @class */ (function () {
    function UpperBoundPhase(inner) {
        this.phase = "upper-bound";
        this.inner = inner;
    }
    UpperBoundPhase.start = function (captain) {
        return new UpperBoundPhase(new common_1.WaxingPhase(captain, 1, 1, captain));
    };
    UpperBoundPhase.prototype.next = function (t) {
        var x = this.inner.next(t);
        if (!x.done) {
            return new UpperBoundPhase(x.value);
        }
        var context = PartitionContext.createNew(x.value, 2, this.inner.captain ? 1 : 2);
        return new FlashLightsPhase(context);
    };
    UpperBoundPhase.prototype.willFlip = function () {
        return this.inner.active;
    };
    UpperBoundPhase.prototype.description = function () {
        if (this.inner.phase == "waxing") {
            var limit = this.inner.round;
            return "Upper Bound Phase: Round ".concat(this.inner.round, ", Waxing ").concat(this.inner.day, "/").concat(limit);
        }
        else {
            var limit = Math.pow(2, this.inner.round);
            return "Upper Bound Phase: Round ".concat(this.inner.round, ", Waning ").concat(this.inner.day, "/").concat(limit);
        }
    };
    UpperBoundPhase.prototype.commonKnowledge = function () {
        return [];
    };
    return UpperBoundPhase;
}());
// TODO there's gotta be a better way than defining boring constructors
var PartitionContext = /** @class */ (function () {
    function PartitionContext(upperBound, numPartitions, myPartition, enumerationOrder, enumerationPosition, intersectionHistory) {
        this.upperBound = upperBound;
        this.numPartitions = numPartitions;
        this.myPartition = myPartition;
        this.enumerationOrder = enumerationOrder;
        this.enumerationPosition = enumerationPosition;
        this.intersectionHistory = intersectionHistory;
    }
    PartitionContext.createNew = function (upperBound, numPartitions, myPartition) {
        // Create a list of all subsets, except the trivial ones
        var subsets = [[]];
        var _loop_1 = function (i) {
            // Add subsets with and without the element i
            subsets = subsets.concat(subsets.map(function (x) { return x.concat([i]); }));
        };
        for (var i = 1; i <= numPartitions; i++) {
            _loop_1(i);
        }
        // Drop the first and last element
        subsets = subsets.slice(1, -1);
        return new PartitionContext(upperBound, numPartitions, myPartition, subsets, 0, []);
    };
    PartitionContext.prototype.next = function (t) {
        if (this.enumerationPosition == this.enumerationOrder.length) {
            throw "Internal error, should not have called PartitionContext.next() that many times";
        }
        // Add the new equation
        var copy = new PartitionContext(this.upperBound, this.numPartitions, this.myPartition, this.enumerationOrder, this.enumerationPosition, this.intersectionHistory);
        copy.intersectionHistory.push(t);
        copy.enumerationPosition += 1;
        // Check if we can solve the equation right now
        var lhs = copy.enumerationOrder.slice(0, copy.enumerationPosition);
        var rhs = copy.intersectionHistory;
        var result = trySolveEquations(copy.numPartitions, lhs, rhs);
        if (result == null) {
            return { done: false, value: copy };
        }
        else {
            return { done: true, value: [lhs, rhs] };
        }
    };
    PartitionContext.prototype.currentSubset = function () {
        return this.enumerationOrder[this.enumerationPosition];
    };
    PartitionContext.prototype.inCurrentSubset = function () {
        return this.currentSubset().includes(this.myPartition);
    };
    PartitionContext.prototype.bumpIndex = function (intersection) {
        if (this.enumerationPosition == this.enumerationOrder.length - 1) {
            return null;
        }
        return new PartitionContext(this.upperBound, this.numPartitions, this.myPartition, this.enumerationOrder, this.enumerationPosition + 1, this.intersectionHistory.concat([intersection]));
    };
    PartitionContext.prototype.splitIndex = function (j, flashed) {
        return PartitionContext.createNew(this.upperBound, this.numPartitions + 1, this.myPartition == j && !flashed ? this.numPartitions + 1 : this.myPartition);
    };
    return PartitionContext;
}());
var PartitionSubcontext = /** @class */ (function () {
    function PartitionSubcontext(numPartitions, wasFlashed, round, intersected) {
        this.numPartitions = numPartitions;
        this.wasFlashed = wasFlashed;
        this.round = round;
        this.intersected = intersected;
    }
    PartitionSubcontext.prototype.next = function (t) {
        var x = this.intersected.concat(t ? [this.round] : []);
        if (this.round != this.numPartitions) {
            return { done: false, value: new PartitionSubcontext(this.numPartitions, this.wasFlashed, this.round + 1, x) };
        }
        return { done: true, value: x };
    };
    return PartitionSubcontext;
}());
var FlashLightsPhase = /** @class */ (function () {
    function FlashLightsPhase(context) {
        this.phase = "flash";
        this.context = context;
    }
    FlashLightsPhase.prototype.next = function (t) {
        var subcontext = new PartitionSubcontext(this.context.numPartitions, t, 1, []);
        return RefinePartitionPhase1.start(this.context, subcontext);
    };
    FlashLightsPhase.prototype.willFlip = function () {
        return this.context.inCurrentSubset();
    };
    FlashLightsPhase.prototype.description = function () {
        return "Flash Day: I = {".concat(this.context.currentSubset(), "}");
    };
    FlashLightsPhase.prototype.commonKnowledge = function () {
        var facts = ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numPartitions, " partitions")];
        for (var i = 0; i < this.context.enumerationPosition; i++) {
            facts.push("{".concat(this.context.enumerationOrder[i], "} tagged {").concat(this.context.intersectionHistory[i], "}"));
        }
        return facts;
    };
    return FlashLightsPhase;
}());
var RefinePartitionPhase1 = /** @class */ (function () {
    function RefinePartitionPhase1(context, subcontext, announcement) {
        this.phase = "refine-1";
        this.context = context;
        this.subcontext = subcontext;
        this.announcement = announcement;
    }
    RefinePartitionPhase1.start = function (context, subcontext) {
        // Announce if you're in S_j and T
        var a = new common_1.Announcement(context.myPartition == subcontext.round && subcontext.wasFlashed, context.upperBound, 1);
        return new RefinePartitionPhase1(context, subcontext, a);
    };
    RefinePartitionPhase1.prototype.next = function (t) {
        var x = this.announcement.next(t);
        if (!x.done) {
            return new RefinePartitionPhase1(this.context, this.subcontext, x.value);
        }
        // Record whether S_j intersect T was empty or not, and proceed to check S_j minus T
        var wasInhabited = x.value;
        var a = new common_1.Announcement(this.context.myPartition == this.subcontext.round && !this.subcontext.wasFlashed, this.context.upperBound, 1);
        return new RefinePartitionPhase2(this.context, this.subcontext, wasInhabited, a);
    };
    RefinePartitionPhase1.prototype.willFlip = function () {
        return this.announcement.active;
    };
    RefinePartitionPhase1.prototype.description = function () {
        return "(I = {".concat(this.context.currentSubset(), "}) Announcement: S_").concat(this.subcontext.round, " \u2229 T? Step ").concat(this.announcement.day, "/").concat(this.context.upperBound);
    };
    RefinePartitionPhase1.prototype.commonKnowledge = function () {
        var facts = ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numPartitions, " partitions")];
        for (var i = 0; i < this.context.enumerationPosition; i++) {
            facts.push("{".concat(this.context.enumerationOrder[i], "} tagged {").concat(this.context.intersectionHistory[i], "}"));
        }
        facts.push("{".concat(this.context.currentSubset(), "} tagged {").concat(this.subcontext.intersected, ", ...}"));
        return facts;
    };
    return RefinePartitionPhase1;
}());
var RefinePartitionPhase2 = /** @class */ (function () {
    function RefinePartitionPhase2(context, subcontext, previousAnnouncement, announcement) {
        this.phase = "refine-2";
        this.context = context;
        this.subcontext = subcontext;
        this.previousAnnouncement = previousAnnouncement;
        this.announcement = announcement;
    }
    RefinePartitionPhase2.prototype.next = function (t) {
        var x = this.announcement.next(t);
        if (!x.done) {
            return new RefinePartitionPhase2(this.context, this.subcontext, this.previousAnnouncement, x.value);
        }
        // Did both announcements return a positive result? If so, we should abandon the outer loop,
        // split the partition, and start over.
        if (this.previousAnnouncement && x.value) {
            var splitContext = this.context.splitIndex(this.subcontext.round, this.subcontext.wasFlashed);
            return new FlashLightsPhase(splitContext);
        }
        // Check whether we're still working in the same round
        var result = this.subcontext.next(this.previousAnnouncement);
        if (!result.done) {
            return RefinePartitionPhase1.start(this.context, result.value);
        }
        // Check whether we're done with the parent context too
        var result2 = this.context.next(result.value);
        if (!result2.done) {
            return new FlashLightsPhase(result2.value);
        }
        // Otherwise, we're done!
        var _a = __read(result2.value, 2), lhs = _a[0], rhs = _a[1];
        return new FinalState(this.context.numPartitions, lhs, rhs);
    };
    RefinePartitionPhase2.prototype.willFlip = function () {
        return this.announcement.active;
    };
    RefinePartitionPhase2.prototype.description = function () {
        return "(I = {".concat(this.context.currentSubset(), "}) Announcement: S_").concat(this.subcontext.round, " \\ T? Step ").concat(this.announcement.day, "/").concat(this.context.upperBound);
    };
    RefinePartitionPhase2.prototype.commonKnowledge = function () {
        var facts = ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numPartitions, " partitions")];
        for (var i = 0; i < this.context.enumerationPosition; i++) {
            facts.push("{".concat(this.context.enumerationOrder[i], "} tagged {").concat(this.context.intersectionHistory[i], "}"));
        }
        facts.push("{".concat(this.context.currentSubset(), "} tagged {").concat(this.subcontext.intersected, ", ...}"));
        return facts;
    };
    return RefinePartitionPhase2;
}());
var FinalState = /** @class */ (function () {
    function FinalState(numPartitions, enumerationOrder, intersectionHistory) {
        this.phase = "final";
        this.numPartitions = numPartitions;
        this.enumerationOrder = enumerationOrder;
        this.intersectionHistory = intersectionHistory;
    }
    FinalState.prototype.next = function (t) {
        return this;
    };
    FinalState.prototype.willFlip = function () {
        return false;
    };
    FinalState.prototype.description = function () {
        return "Puzzle Complete";
    };
    FinalState.prototype.commonKnowledge = function () {
        var _this = this;
        var facts = this.enumerationOrder.map(function (lhs, i) {
            var rhs = _this.intersectionHistory[i];
            var lhsStr = lhs.map(function (i) { return "x_".concat(i); }).join(" + ");
            var rhsStr = rhs.map(function (i) { return "x_".concat(i); }).join(" + ");
            return "".concat(lhsStr, " = ").concat(rhsStr);
        });
        facts.push("x_1 = 1");
        // Now get the unique solution
        var solution = trySolveEquations(this.numPartitions, this.enumerationOrder, this.intersectionHistory);
        var solnStr = solution.map(function (x, i) { return "x_".concat(i + 1, " = ").concat(x); }).join(", ");
        var total = solution.reduce(function (a, b) { return a + b; });
        facts.push("Unique solution is: ".concat(solnStr, ", for a total of ").concat(total, " prisoners"));
        return facts;
    };
    return FinalState;
}());
var Graphics = /** @class */ (function () {
    function Graphics(drawing, name) {
        this.group = drawing.group();
        this.circle = this.group.circle(2 * PRISONER_RADIUS);
        this.name = this.group.text(name);
        this.number = this.group.text("");
        this.candidate = this.group.circle(COIN_DIAMETER).hide();
        this["switch"] = this.group.polygon([0, 0, 0, SWITCH_HEIGHT, SWITCH_WIDTH, SWITCH_HEIGHT / 2]);
        // Position the elements
        var cx = this.circle.cx();
        var cy = this.circle.cy();
        this.name.center(cx, cy);
        this.candidate.center(cx + PRISONER_RADIUS, cy - PRISONER_RADIUS);
        this["switch"].center(cx + PRISONER_SPACING / 2, cy);
        // Color them
        this.circle.fill(INACTIVE_COLOR).stroke(BORDER_COLOR);
        this.candidate.fill(CANDIDATE_COLOR).stroke(BORDER_COLOR);
        this["switch"].fill(INACTIVE_COLOR).stroke(BORDER_COLOR);
        // Push the circle to the rearmost
        this.circle.back();
    }
    Graphics.prototype.drawState = function (state, light) {
        var color;
        var number;
        var candidate;
        switch (state.phase) {
            case "upper-bound": {
                if (state.inner.phase == "waxing") {
                    var active = state.inner.active || (light !== null && light !== void 0 ? light : false);
                    color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                }
                else {
                    var active = state.inner.active && (light !== null && light !== void 0 ? light : true);
                    color = active ? WANING_COLOR : INACTIVE_COLOR;
                }
                number = null;
                candidate = false;
                break;
            }
            case "flash": {
                var active = state.context.inCurrentSubset();
                color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                number = state.context.myPartition;
                candidate = (light !== null && light !== void 0 ? light : false);
                break;
            }
            case "refine-1": {
                var active = state.announcement.active || (light !== null && light !== void 0 ? light : false);
                color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                number = state.context.myPartition;
                candidate = state.subcontext.wasFlashed;
                break;
            }
            case "refine-2": {
                var active = state.announcement.active || (light !== null && light !== void 0 ? light : false);
                color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                number = state.context.myPartition;
                candidate = state.subcontext.wasFlashed;
                break;
            }
            case "final": {
                color = INACTIVE_COLOR;
                number = null;
                candidate = false;
                break;
            }
            default:
                var _exhaustiveCheck = state;
                return _exhaustiveCheck;
        }
        this.circle.fill(color);
        if (number !== null) {
            this.number.show().text(number.toString());
        }
        else {
            this.number.hide();
        }
        if (candidate) {
            this.candidate.show();
        }
        else {
            this.candidate.hide();
        }
        // Reposition the text
        this.number.center(this.circle.cx() - PRISONER_RADIUS, this.circle.cy() + PRISONER_RADIUS);
    };
    Graphics.prototype.drawSwitch = function (willFlip) {
        this["switch"].fill(willFlip ? ACTIVE_COLOR : INACTIVE_COLOR);
    };
    Graphics.prototype.move = function (x, y) {
        this.group.move(x, y);
    };
    return Graphics;
}());
exports.Graphics = Graphics;
// If there's a unique solution, returns it, otherwise returns null
function trySolveEquations(numVariables, lhss, rhss) {
    // Remember, these are 1-indexed! TODO: make everything 0 indexed where possible
    var numRows = lhss.length + 1; // +1 because x_1 = 1
    var numCols = numVariables + 1;
    var rows = lhss.map(function (lhs, i) {
        var e_1, _a, e_2, _b;
        var rhs = rhss[i];
        var row = Array(numCols).fill(0);
        try {
            for (var lhs_1 = __values(lhs), lhs_1_1 = lhs_1.next(); !lhs_1_1.done; lhs_1_1 = lhs_1.next()) {
                var x = lhs_1_1.value;
                row[x - 1] += 1;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (lhs_1_1 && !lhs_1_1.done && (_a = lhs_1["return"])) _a.call(lhs_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var rhs_1 = __values(rhs), rhs_1_1 = rhs_1.next(); !rhs_1_1.done; rhs_1_1 = rhs_1.next()) {
                var x = rhs_1_1.value;
                row[x - 1] -= 1;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (rhs_1_1 && !rhs_1_1.done && (_b = rhs_1["return"])) _b.call(rhs_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return row;
    });
    // This row encodes the fact that x_1 = 1
    var lastRow = Array(numCols).fill(0);
    lastRow[0] = lastRow[numCols - 1] = 1;
    rows.push(lastRow);
    // TODO: shunt this into some stdlib
    function range(a, b) {
        if (b < a) {
            return [];
        }
        return Array(b - a).fill(0).map(function (_, i) { return i + a; });
    }
    function max_by(array, key) {
        return array.reduce(function (a, b) { return key(a) >= key(b) ? a : b; });
    }
    // Now put the matrix in RREF form
    var pivotRow = 0;
    var pivotColumn = 0;
    while (pivotRow < numRows && pivotColumn < numCols) {
        // Find the pivot for this column
        var _a = __read(max_by(range(pivotRow, numRows).map(function (i) { return [rows[i][pivotColumn], i]; }), function (tup) { return Math.abs(tup[0]); }), 2), valMax = _a[0], iMax = _a[1];
        if (valMax == 0) {
            // No pivot in this column
            pivotColumn += 1;
        }
        else {
            // Swap this row into the pivot row
            var tmp = rows[pivotRow];
            rows[pivotRow] = rows[iMax];
            rows[iMax] = tmp;
            // Normalize this row
            var mul = rows[pivotRow][pivotColumn];
            for (var j = 0; j < numCols; j++) {
                rows[pivotRow][j] /= mul;
            }
            // For all rows other than pivot, clear the column
            for (var i = 0; i < rows.length; i++) {
                if (i == pivotRow) {
                    continue;
                }
                var mul_1 = rows[i][pivotColumn];
                for (var j = 0; j < numCols; j++) {
                    rows[i][j] -= rows[pivotRow][j] * mul_1;
                }
            }
            pivotRow += 1;
            pivotColumn += 1;
        }
    }
    // Detect whether we have a solution.
    if (numRows < numVariables) {
        return null;
    }
    // Check if the upper-left looks like an identity matrix.
    for (var i = 0; i < numVariables; i++) {
        for (var j = 0; j < numVariables; j++) {
            if (i == j && rows[i][j] != 1) {
                return null;
            }
            if (i != j && rows[i][j] != 0) {
                return null;
            }
        }
    }
    // Sanity check, all other rows should be all zero
    for (var i = numVariables; i < numRows; i++) {
        for (var j = 0; j < numCols; j++) {
            if (rows[i][j] != 0) {
                throw "RREF failure!" + rows.toString();
            }
        }
    }
    // Great! Now we just copy off the last column
    return range(0, numVariables).map(function (i) { return rows[i][numCols - 1]; });
}
//# sourceMappingURL=fancy.js.map

/***/ }),

/***/ 31:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


exports.__esModule = true;
exports.Graphics = exports.startState = void 0;
var common_1 = __webpack_require__(353);
var ACTIVE_COLOR = "#ffff00";
var WANING_COLOR = "#ffcc00";
var INACTIVE_COLOR = "#808080";
var CANDIDATE_COLOR = "#00ffff";
var BORDER_COLOR = "#000000";
var PRISONER_RADIUS = 20;
var PRISONER_SPACING = 80;
var COIN_DIAMETER = 10;
var SWITCH_HEIGHT = 30;
var SWITCH_WIDTH = 15;
function startState(captain) {
    return UpperBoundPhase.start(captain);
}
exports.startState = startState;
var UpperBoundPhase = /** @class */ (function () {
    function UpperBoundPhase(inner) {
        this.phase = "upper-bound";
        this.inner = inner;
    }
    UpperBoundPhase.start = function (captain) {
        return new UpperBoundPhase(new common_1.WaxingPhase(captain, 1, 1, captain));
    };
    UpperBoundPhase.prototype.next = function (t) {
        var x = this.inner.next(t);
        if (!x.done) {
            return new UpperBoundPhase(x.value);
        }
        return AnyoneUnnumberedPhase.start({ myNumber: this.inner.captain ? 1 : null, numNumbered: 1, upperBound: x.value });
    };
    UpperBoundPhase.prototype.willFlip = function () {
        return this.inner.active;
    };
    UpperBoundPhase.prototype.description = function () {
        if (this.inner.phase == "waxing") {
            var limit = this.inner.round;
            return "Upper Bound Phase: Round ".concat(this.inner.round, ", Waxing ").concat(this.inner.day, "/").concat(limit);
        }
        else {
            var limit = Math.pow(2, this.inner.round);
            return "Upper Bound Phase: Round ".concat(this.inner.round, ", Waning ").concat(this.inner.day, "/").concat(limit);
        }
    };
    UpperBoundPhase.prototype.commonKnowledge = function () {
        return [];
    };
    return UpperBoundPhase;
}());
var AnyoneUnnumberedPhase = /** @class */ (function () {
    function AnyoneUnnumberedPhase(context, announcement) {
        this.phase = "unnumbered-announce";
        this.context = context;
        this.announcement = announcement;
    }
    AnyoneUnnumberedPhase.start = function (context) {
        var a = new common_1.Announcement(context.myNumber === null, context.upperBound, 1);
        return new AnyoneUnnumberedPhase(context, a);
    };
    // TODO: this kind of pattern keeps happening. How do I reduce this?
    AnyoneUnnumberedPhase.prototype.next = function (t) {
        var x = this.announcement.next(t);
        if (!x.done) {
            return new AnyoneUnnumberedPhase(this.context, x.value);
        }
        // If we're still active, someone was unnumbered. Proceed.
        if (x.value) {
            var probability = 1 / this.context.numNumbered;
            var coinFlip = (this.context.myNumber !== null) ? Math.random() < probability : false;
            return new CandidateSelectionPhase(this.context, coinFlip);
        }
        else {
            // Otherwise we're done!
            return new FinalState(this.context.numNumbered);
        }
    };
    AnyoneUnnumberedPhase.prototype.willFlip = function () {
        return this.announcement.active;
    };
    AnyoneUnnumberedPhase.prototype.description = function () {
        return "Announcement: Anyone Unnumbered? Step ".concat(this.announcement.day, "/").concat(this.context.upperBound);
    };
    AnyoneUnnumberedPhase.prototype.commonKnowledge = function () {
        return ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numNumbered, " prisoners numbered")];
    };
    return AnyoneUnnumberedPhase;
}());
var FinalState = /** @class */ (function () {
    function FinalState(answer) {
        this.phase = "final";
        this.answer = answer;
    }
    FinalState.prototype.next = function (t) {
        return this;
    };
    FinalState.prototype.willFlip = function () {
        return false;
    };
    FinalState.prototype.description = function () {
        return "Puzzle Complete";
    };
    FinalState.prototype.commonKnowledge = function () {
        return ["N = ".concat(this.answer)];
    };
    return FinalState;
}());
var CandidateSelectionPhase = /** @class */ (function () {
    function CandidateSelectionPhase(context, coinFlip) {
        this.phase = "coin-flip";
        this.context = context;
        this.coinFlip = coinFlip;
    }
    CandidateSelectionPhase.prototype.next = function (t) {
        return CandidateReportingPhase.start(this.context, this.coinFlip, t);
    };
    CandidateSelectionPhase.prototype.willFlip = function () {
        return this.coinFlip;
    };
    CandidateSelectionPhase.prototype.description = function () {
        return "Numbered Prisoners Flip Coin";
    };
    CandidateSelectionPhase.prototype.commonKnowledge = function () {
        return ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numNumbered, " prisoners numbered")];
    };
    return CandidateSelectionPhase;
}());
var CandidateReportingPhase = /** @class */ (function () {
    function CandidateReportingPhase(context, coinFlip, isCandidate, numHeads, round, announcement) {
        this.phase = "coin-announce";
        this.context = context;
        this.coinFlip = coinFlip;
        this.isCandidate = isCandidate;
        this.numHeads = numHeads;
        this.round = round;
        this.announcement = announcement;
    }
    CandidateReportingPhase.start = function (context, coinFlip, isCandidate) {
        return CandidateReportingPhase.startOfRound(context, coinFlip, isCandidate, 0, 1);
    };
    CandidateReportingPhase.startOfRound = function (context, coinFlip, isCandidate, numberHeads, round) {
        // We're active this round if the new round is our number and we flipped heads
        var a = new common_1.Announcement((round == context.myNumber) && coinFlip, context.upperBound, 1);
        return new CandidateReportingPhase(context, coinFlip, isCandidate, numberHeads, round, a);
    };
    CandidateReportingPhase.prototype.next = function (t) {
        var x = this.announcement.next(t);
        if (!x.done) {
            return new CandidateReportingPhase(this.context, this.coinFlip, this.isCandidate, this.numHeads, this.round, x.value);
        }
        // If we're active it means that someone flipped heads
        var newNumHeads = this.numHeads + (x.value ? 1 : 0);
        if (this.round < this.context.numNumbered) {
            return CandidateReportingPhase.startOfRound(this.context, this.coinFlip, this.isCandidate, newNumHeads, this.round + 1);
        }
        else {
            return CandidateAnnouncementPhase.start(this.context, this.isCandidate, newNumHeads);
        }
    };
    CandidateReportingPhase.prototype.willFlip = function () {
        return this.announcement.active;
    };
    CandidateReportingPhase.prototype.description = function () {
        return "Announcement: Results of ".concat(this.round, "'s flip. Step ").concat(this.announcement.day, "/").concat(this.context.upperBound);
    };
    CandidateReportingPhase.prototype.commonKnowledge = function () {
        return ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numNumbered, " prisoners numbered"), "".concat(this.numHeads, " heads flipped (so far)")];
    };
    return CandidateReportingPhase;
}());
var CandidateAnnouncementPhase = /** @class */ (function () {
    function CandidateAnnouncementPhase(context, isCandidate, numHeads, announcement) {
        this.phase = "candidate-announce";
        this.context = context;
        this.isCandidate = isCandidate;
        this.numHeads = numHeads;
        this.announcement = announcement;
    }
    CandidateAnnouncementPhase.start = function (context, isCandidate, numHeads) {
        var a = new common_1.Announcement(context.myNumber === null && isCandidate, context.upperBound, 1);
        return new CandidateAnnouncementPhase(context, isCandidate, numHeads, a);
    };
    CandidateAnnouncementPhase.prototype.next = function (t) {
        var x = this.announcement.next(t);
        if (!x.done) {
            return new CandidateAnnouncementPhase(this.context, this.isCandidate, this.numHeads, x.value);
        }
        else {
            // If there was one heads, and some unnumbered candidate announced, then
            // we've assigned a new number :D
            var existsUnnumberedCandidate = x.value;
            var numNumbered = this.context.numNumbered;
            var myNumber = this.context.myNumber;
            if (existsUnnumberedCandidate && this.numHeads == 1) {
                numNumbered += 1;
                if (this.isCandidate) {
                    myNumber = numNumbered;
                }
            }
            return AnyoneUnnumberedPhase.start({ myNumber: myNumber, numNumbered: numNumbered, "upperBound": this.context.upperBound });
        }
    };
    CandidateAnnouncementPhase.prototype.willFlip = function () {
        return this.announcement.active;
    };
    CandidateAnnouncementPhase.prototype.description = function () {
        return "Announcement: Unnumbered Candidate? Step ".concat(this.announcement.day, "/").concat(this.context.upperBound);
    };
    CandidateAnnouncementPhase.prototype.commonKnowledge = function () {
        return ["N \u2264 ".concat(this.context.upperBound), "".concat(this.context.numNumbered, " prisoners numbered"), "".concat(this.numHeads, " heads flipped")];
    };
    return CandidateAnnouncementPhase;
}());
// TODO: maybe we do state.render(graphics)?
var Graphics = /** @class */ (function () {
    function Graphics(drawing, name) {
        this.group = drawing.group();
        this.circle = this.group.circle(2 * PRISONER_RADIUS);
        this.name = this.group.text(name);
        this.number = this.group.text("");
        this.coin = this.group.circle(COIN_DIAMETER).hide();
        this.candidate = this.group.circle(COIN_DIAMETER).hide();
        this["switch"] = this.group.polygon([0, 0, 0, SWITCH_HEIGHT, SWITCH_WIDTH, SWITCH_HEIGHT / 2]);
        // Position the elements
        var cx = this.circle.cx();
        var cy = this.circle.cy();
        this.name.center(cx, cy);
        this.coin.center(cx + PRISONER_RADIUS, cy + PRISONER_RADIUS);
        this.candidate.center(cx + PRISONER_RADIUS, cy - PRISONER_RADIUS);
        this["switch"].center(cx + PRISONER_SPACING / 2, cy);
        // Color them
        this.circle.fill(INACTIVE_COLOR).stroke(BORDER_COLOR);
        this.coin.stroke(BORDER_COLOR);
        this.candidate.fill(CANDIDATE_COLOR).stroke(BORDER_COLOR);
        this["switch"].fill(INACTIVE_COLOR).stroke(BORDER_COLOR);
        // Push the circle to the rearmost
        this.circle.back();
    }
    Graphics.prototype.drawState = function (state, light) {
        var _a, _b, _c, _d;
        var color;
        var number;
        var coin;
        var candidate;
        switch (state.phase) {
            case "upper-bound": {
                if (state.inner.phase == "waxing") {
                    var active = state.inner.active || (light !== null && light !== void 0 ? light : false);
                    color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                }
                else {
                    var active = state.inner.active && (light !== null && light !== void 0 ? light : true);
                    color = active ? WANING_COLOR : INACTIVE_COLOR;
                }
                number = null;
                coin = null;
                candidate = false;
                break;
            }
            case "unnumbered-announce": {
                var active = state.announcement.active || (light !== null && light !== void 0 ? light : false);
                color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                number = (_a = state.context.myNumber) !== null && _a !== void 0 ? _a : null;
                coin = null;
                candidate = false;
                break;
            }
            case "coin-flip": {
                color = INACTIVE_COLOR;
                number = (_b = state.context.myNumber) !== null && _b !== void 0 ? _b : null;
                coin = state.context.myNumber !== null ? state.coinFlip : null;
                candidate = light !== null && light !== void 0 ? light : false;
                break;
            }
            case "coin-announce": {
                var active = state.announcement.active || (light !== null && light !== void 0 ? light : false);
                color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                number = (_c = state.context.myNumber) !== null && _c !== void 0 ? _c : null;
                coin = state.context.myNumber !== null ? state.coinFlip : null;
                candidate = state.isCandidate;
                break;
            }
            case "candidate-announce": {
                var active = state.announcement.active || (light !== null && light !== void 0 ? light : false);
                color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
                number = (_d = state.context.myNumber) !== null && _d !== void 0 ? _d : null;
                coin = null;
                candidate = state.isCandidate;
                break;
            }
            case "final": {
                color = INACTIVE_COLOR;
                number = null;
                coin = null;
                candidate = false;
                break;
            }
            default:
                var _exhaustiveCheck = state;
                return _exhaustiveCheck;
        }
        this.circle.fill(color);
        if (number !== null) {
            this.number.show().text(number.toString());
        }
        else {
            this.number.hide();
        }
        if (coin !== null) {
            this.coin.show().fill(coin ? ACTIVE_COLOR : INACTIVE_COLOR);
        }
        else {
            this.coin.hide();
        }
        if (candidate) {
            this.candidate.show();
        }
        else {
            this.candidate.hide();
        }
        // Reposition the text
        this.number.center(this.circle.cx() - PRISONER_RADIUS, this.circle.cy() + PRISONER_RADIUS);
    };
    Graphics.prototype.drawSwitch = function (willFlip) {
        this["switch"].fill(willFlip ? ACTIVE_COLOR : INACTIVE_COLOR);
    };
    Graphics.prototype.move = function (x, y) {
        this.group.move(x, y);
    };
    return Graphics;
}());
exports.Graphics = Graphics;
//# sourceMappingURL=simple.js.map

/***/ }),

/***/ 557:
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
var simple_1 = __webpack_require__(31);
var fancy_1 = __webpack_require__(77);
// TODO: don't duplicate constants like this!
var PRISONER_RADIUS = 20;
var PRISONER_SPACING = 80;
var SCENE_PADDING = 10;
// TODO: now what? I have to figure out how to visually show this!
// okay, here's the way i see it
// - then add the ability to click and drag people into different slots
//   (w/ optional checkbox for random)
// - then add fancier visuals
// - start over button
var Prisoner = /** @class */ (function () {
    function Prisoner(state, graphics, name) {
        this.graphics = graphics;
        this.state = state;
        this.name = name;
    }
    Prisoner.prototype.draw = function (light) {
        this.graphics.drawState(this.state, light);
        this.graphics.drawSwitch(this.state.willFlip());
    };
    return Prisoner;
}());
function shuffleArray(array) {
    var _a;
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = __read([array[j], array[i]], 2), array[i] = _a[0], array[j] = _a[1];
    }
}
var Experiment = /** @class */ (function () {
    function Experiment(drawing, numPrisoners, startStateFn, graphicsFn) {
        this.prisoners = Array.from(Array(numPrisoners).keys()).map(function (i) {
            var captain = i == 0;
            var name = String.fromCharCode(65 + i);
            return new Prisoner(startStateFn(captain), graphicsFn(drawing, name), name);
        });
        this.state = { state: "A" };
        this.numDays = 1;
        this.historyStack = [];
        this.startStateFn = startStateFn;
        drawing.viewbox(0, 0, numPrisoners * PRISONER_SPACING + SCENE_PADDING, 2 * PRISONER_RADIUS + 2 * SCENE_PADDING);
    }
    Experiment.prototype.advance = function () {
        var _this = this;
        var numPrisoners = this.prisoners.length;
        switch (this.state.state) {
            case "A": {
                // Prisoners have already decided whether to flip the switch, based on what they saw yesterday.
                var lights = new Map(this.prisoners.map(function (p, idx) {
                    // A prisoner will see a light if the prisoner before them flipped the switch.
                    var prev = _this.prisoners[(idx + numPrisoners - 1) % numPrisoners];
                    var seesLight = prev.state.willFlip();
                    return [p, seesLight];
                }));
                this.state = { state: "B", lights: lights };
                break;
            }
            case "B": {
                // Nighttime, time to scramble the prisoners and update
                // their states. But first, save the state.
                var history_1 = this.prisoners.map(function (p) { return [p, p.state]; });
                this.historyStack.push(history_1);
                shuffleArray(this.prisoners);
                var lights_1 = this.state.lights;
                this.prisoners.forEach(function (p) { return p.state = p.state.next(lights_1.get(p)); });
                this.state = { state: "A" };
                this.numDays += 1;
                break;
            }
            case "C": {
                // do nothing
                break;
            }
        }
    };
    Experiment.prototype.undo = function () {
        switch (this.state.state) {
            case "A": {
                var history_2 = this.historyStack.pop();
                if (history_2 === undefined) {
                    return;
                }
                this.prisoners = history_2.map(function (h) {
                    var _a = __read(h, 2), p = _a[0], state = _a[1];
                    p.state = state;
                    return p;
                });
                this.numDays -= 1;
                this.advance();
                break;
            }
            case "B": {
                // Drop the extra data
                this.state = { state: "A" };
                break;
            }
            case "C": {
                // do nothing
                break;
            }
        }
    };
    Experiment.prototype.startOver = function () {
        var _this = this;
        this.prisoners.sort(function (a, b) { return a.name.localeCompare(b.name); });
        this.prisoners.forEach(function (p, i) { return p.state = _this.startStateFn(i == 0); });
        this.state = { state: "A" };
        this.numDays = 1;
        this.historyStack = [];
    };
    Experiment.prototype.draw = function () {
        // Move prisoner graphics
        this.prisoners.forEach(function (p, i) {
            p.graphics.move(SCENE_PADDING + PRISONER_SPACING * i, SCENE_PADDING);
        });
        switch (this.state.state) {
            case "A": {
                this.prisoners.forEach(function (p) { return p.draw(null); });
                break;
            }
            case "B": {
                var lights_2 = this.state.lights;
                this.prisoners.forEach(function (p) { return p.draw(lights_2.get(p)); });
                break;
            }
            case "C": {
                // do nothing
                break;
            }
        }
    };
    Experiment.prototype.currentState = function () {
        var state = this.prisoners[0].state;
        return state.description();
    };
    Experiment.prototype.commonKnowledge = function () {
        var state = this.prisoners[0].state;
        return "<ul>" + state.commonKnowledge().map(function (x) { return "<li>" + x + "</li>"; }).join("\n") + "</ul>";
    };
    return Experiment;
}());
var ExperimentApplet = /** @class */ (function () {
    function ExperimentApplet(numPrisoners, suffix, startStateFn, graphicsFn) {
        var _this = this;
        this.experiment = new Experiment(SVG("prison-interactive-" + suffix), numPrisoners, startStateFn, graphicsFn);
        this.nextButton = document.getElementById("next-button-" + suffix);
        this.undoButton = document.getElementById("undo-button-" + suffix);
        this.finishPhaseButton = document.getElementById("finish-phase-button-" + suffix);
        this.startOverButton = document.getElementById("start-over-button-" + suffix);
        this.dayCounter = document.getElementById("day-counter-" + suffix);
        this.stateText = document.getElementById("state-description-" + suffix);
        this.commonKnowledge = document.getElementById("common-knowledge-" + suffix);
        this.nextButton.addEventListener("click", function (event) {
            var currentPhase = _this.experiment.prisoners[0].state.phase;
            if (currentPhase == "final") {
                return;
            }
            _this.experiment.advance();
            _this.drawEverything();
        });
        this.finishPhaseButton.addEventListener("click", function (event) {
            var currentPhase = _this.experiment.prisoners[0].state.phase;
            if (currentPhase == "final") {
                return;
            }
            while (_this.experiment.prisoners[0].state.phase == currentPhase) {
                _this.experiment.advance();
                _this.drawEverything();
            }
        });
        this.undoButton.addEventListener("click", function (event) {
            _this.experiment.undo();
            _this.drawEverything();
        });
        this.startOverButton.addEventListener("click", function (event) {
            _this.experiment.startOver();
            _this.drawEverything();
        });
    }
    ExperimentApplet.prototype.drawEverything = function () {
        this.experiment.draw();
        var time = this.experiment.state.state == "A" ? "Day" : "Night";
        this.dayCounter.textContent = "".concat(time, " ").concat(this.experiment.numDays);
        this.stateText.textContent = this.experiment.currentState();
        this.commonKnowledge.innerHTML = this.experiment.commonKnowledge();
    };
    return ExperimentApplet;
}());
// Create experiments and link them to the HTML visuals
var experiment1 = new ExperimentApplet(5, "1", simple_1.startState, function (drawing, name) { return new simple_1.Graphics(drawing, name); });
var experiment2 = new ExperimentApplet(5, "2", fancy_1.startState, function (drawing, name) { return new fancy_1.Graphics(drawing, name); });
experiment1.drawEverything();
experiment2.drawEverything();
//# sourceMappingURL=circular_prison.js.map

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
/******/ 	var __webpack_exports__ = __webpack_require__(557);
/******/ 	
/******/ })()
;