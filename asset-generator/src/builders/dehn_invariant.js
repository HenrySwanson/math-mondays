"use strict";

// Import our utils library and initialize mathjax+svg
const asset_utils = require("./utils.js");
asset_utils.initMathJax();
asset_utils.initSvg();

// Create the canvas to work on
var canvas = asset_utils.getCanvas();

// Name some colors
const RED = "#c91435";
const GREEN = "#1e963e";
const PURPLE = "#ba36ba";
const YELLOW = "#f7ca36";
const BROWN = "#ad5e0e";
const DK_BLUE = "#4287f5";
const LT_BLUE = "#5db3e8";
const MED_BLUE = "#5fbff9";

// Some helpers for geometry

// we store a line as (A, B, C) where Ax + By = C
function make_line(p, q) {
	// slope = -A/B = (y2-y1)/(x2-x1), so we can say A = y2 - y1 and -B = x2 - x1
	// that leaves C solvable
	var a = q[1] - p[1];
	var b = -(q[0] - p[0]);
	var c = a * p[0] + b * p[1];
	return [a, b, c];
}

function get_midpoint(p, q) {
	return [0.5 * (p[0] + q[0]), 0.5 * (p[1] + q[1])];
}

function intersect_lines(line_1, line_2) {
	// if the lines are Ax + By = E and Cx + Dy = F, then we're trying to solve
	// the usual matrix equation: ABCD * [x, y] = [E, F]
	var [A, B, E] = line_1;
	var [C, D, F] = line_2;

	// solution is 1/det [[D, -B], [-C, A]] [E, F]
	var det = A * D - B * C;
	var x = (D * E - B * F) / det;
	var y = (-C * E + A * F) / det;

	return [x, y];
}

function parallel_to(p, line) {
	// point (x, y) and line Ax + By = C
	// slope doesn't change, so we just evaluate C
	var [A, B, C] = line;
	var C_prime = A * p[0] + B * p[1];
	return [A, B, C_prime];
}

function perp_to(p, line) {
	// point (x, y) and line Ax + By = C
	// slope changes by 90, so (A, B) -> (-B, A), then we evaluate C
	var [A, B, C] = line;
	var C_prime = -B * p[0] + A * p[1];
	return [-B, A, C_prime];
}

function drop_onto(p, line) {
	// return p dropped perpendicularly onto the line
	return intersect_lines(line, perp_to(p, line));
}

function polar(radius, angle) {
	return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function interpolate(p, q, t) {
	return [p[0] * (1 - t) + q[0] * t, p[1] * (1 - t) + q[1] * t];
}

// ---------------------------
// Diagram: Tangrams
// ---------------------------

function makePiece(pts, string, color, stroke_width) {
	// helper function for making tangram drawings easier
	var myPts = [];
	for (var i = 0; i < string.length; i++) {
		myPts.push(letterToPt(string[i], pts));
	}
	return canvas.polygon(myPts).fill(color).stroke({ color: "#000", width: stroke_width, linejoin: "bevel" });
}

function letterToPt(letter, pts) {
	return pts[letter.charCodeAt(0) - 0x41];
}

function makePieces(group, pts, stroke_width, pieceDefs) {
	var strokeStyle = { color: "#000", width: stroke_width, linejoin: "bevel" };
	var pieces = [];
	for (var i = 0; i < pieceDefs.length; i++) {
		var [string, color] = pieceDefs[i];
		var piecePts = string.split('').map(c => letterToPt(c, pts));
		var newPiece = group.polygon(piecePts).fill(color).stroke(strokeStyle);
		pieces.push(newPiece);
	}
	return pieces;
}


function moveAlong(piece, start, end) {
	// moves the piece so that start ends up at end. technically neither point needs
	// to be on the piece
	piece.dmove(end[0] - start[0], end[1] - start[1]);
}

function verticalAlign(groups) {
	// Align to the center of the first box
	var center = groups[0].rbox().cy;
	groups.forEach(g => g.dy(center - g.rbox().cy));
}

// create the tangrams. they lie in this 4x4 block
// +---------------+
// |\ A          B/|
// | \           / |
// |  \    0    /  |
// |   \      H/ 2 |
// |    \     / \  |
// |     \   /   \ |
// |      \E/     \|
// |   1   X   3  F|
// |      / \     /|
// |     /   \   / |
// |    /  4  \ /  |
// |  J/-------/I  |
// |  /       /    |
// | /   5   /  6  |
// |/D     G/     C|
// +---------------+
var pts = [[0, 0], [4, 0], [4, 4], [0, 4], [2, 2], [4, 2], [2, 4], [3, 1], [3, 3], [1, 3]];
var pieceDefs = [["ABE", RED], ["ADE", GREEN], ["BFH", PURPLE],
["EHFI", YELLOW], ["EIJ", BROWN], ["DGIJ", DK_BLUE], ["CFG", LT_BLUE]];
var leftGroup = canvas.group();
makePieces(leftGroup, pts, 0.06, pieceDefs);

var rightGroup = canvas.group().dx(10);
var tangrams = makePieces(rightGroup, pts, 0.06, pieceDefs);

// Reshuffle pieces and save again
var sqrt2 = Math.sqrt(2);
tangrams[0].dmove(0, 4).rotate(-45, 4, 4);
tangrams[1].move(2, 2);
tangrams[2].move(1, 0);
tangrams[3].move(0, 1);
tangrams[4].dmove(-1, -3).rotate(90, 0, 0);
tangrams[5].dmove(4, 2 * sqrt2).rotate(-30, 4, 4 + 2 * sqrt2);
tangrams[6].dmove(0, -2).rotate(135, 2, 2);

verticalAlign([leftGroup, rightGroup]);

// Shrink and save
asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/tangrams.svg");

// TODO add house?

// -------------------------------------
// Diagram: Square <-> Triangle Tangrams
// -------------------------------------

canvas.clear();

function makeTrianglePoints() {
	var sqrt3 = Math.sqrt(3);

	// corners of the triangle are A B C, with C as the apex.
	var A = [0, 0];
	var B = [1, 0];
	var C = [0.5, sqrt3 / 2];

	// D and E bisect AC and BC, respectively.
	var D = get_midpoint(A, C);
	var E = get_midpoint(B, C);

	// F and G are the points on AB
	var F = [0.2455, 0];
	var G = [0.7455, 0];

	// H and I are the interior points
	var midline = make_line(E, F);
	var H = drop_onto(D, midline);
	var I = drop_onto(G, midline);

	return [A, B, C, D, E, F, G, H, I];
}
// flip y-coords so it's right side up
var pts = makeTrianglePoints().map(pt => [pt[0], -pt[1]]);

var pieceDefs = [["DCEH", RED], ["ADHF", GREEN], ["BEIG", DK_BLUE], ["FGI", YELLOW]];
var strokeWidth = 0.015;

var leftGroup = canvas.group();
makePieces(leftGroup, pts, 0.015, pieceDefs);

var rightGroup = canvas.group().dx(1.5);
var pieces = makePieces(rightGroup, pts, 0.015, pieceDefs);

// we leave piece 0 in place

// rotate the 'wings' up
pieces[1].rotate(180, pts[3][0], pts[3][1]);
pieces[2].rotate(180, pts[4][0], pts[4][1]);

// move the tip so F sits on top of (F rotated around D)
var F_ = [2 * pts[3][0] - pts[5][0], 2 * pts[3][1] - pts[5][1]];
moveAlong(pieces[3], pts[5], F_);

verticalAlign([leftGroup, rightGroup]);

// Shrink and save
asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/square-to-triangle.svg");


// -------------------------------------
// Diagram: Square <-> Pentagon Tangrams
// -------------------------------------

canvas.clear();


//                    _ A _
//                _-   /     - _              
//            _-      /           -           
//         -     0   /       1       -        
//       -          /                  -      
//     E---K-------F---------------I-----B    
//      \   \                  -        /     
//      \    \      3      _ J          /     
//       \  2  \        -     \     4  /      
//       \       \   -          \      /      
//        \    _  L               \   /       
//        \  -           5          \ /       
//         H                         G        
//          \                       /         
//           D---------------------C
// 
function makePentagonPoints() {
	// corners of the pentagon are ABCDE
	var [A, B, C, D, E] = [0, 1, 2, 3, 4].map(x => polar(1, Math.PI / 2 - x * Math.PI * 2 / 5));

	// point F is on some intersections
	var AD = make_line(A, D);
	var BE = make_line(B, E);
	var F = intersect_lines(AD, BE);

	// GH is parallel to BE, and they're separated by (height / 2)
	var height = A[1] - C[1];
	var horizontal = [0, 1, B[1] - height / 2];
	var G = intersect_lines(horizontal, make_line(B, C));
	var H = intersect_lines(horizontal, make_line(D, E));

	// HI is parallel to BD
	var HI = parallel_to(H, make_line(B, D));
	var I = intersect_lines(HI, BE);

	// J is G dropped perpendicularly onto HI
	var J = drop_onto(G, HI);

	// KI is a parallel transport of HG
	var K = [I[0] + H[0] - G[0], I[1]];

	// L is K dropped perpendicularly onto HI
	var L = drop_onto(K, HI);

	return [A, B, C, D, E, F, G, H, I, J, K, L];
}
// flip y-coords so it's right side up
var pts = makePentagonPoints().map(pt => [pt[0], -pt[1]]);
var pieceDefs = [["AEF", GREEN], ["ABF", YELLOW], ["EKLH", LT_BLUE],
["ILK", RED], ["BIJG", PURPLE], ["GCDHJ", BROWN]];

var leftGroup = canvas.group();
makePieces(leftGroup, pts, 0.03, pieceDefs);

var rightGroup = canvas.group().dx(3.5);
var pieces = makePieces(rightGroup, pts, 0.03, pieceDefs);

// we keep 5 in place

// to position 0, move A to C
moveAlong(pieces[0], pts[0], pts[2]);

// to position 1, move A to D, then rotate around D
moveAlong(pieces[1], pts[0], pts[3]);
pieces[1].rotate(-36, pts[3][0], pts[3][1]);

// for 2 and 4 just rotate around H and G, respectively
pieces[2].rotate(180, pts[7][0], pts[7][1]);
pieces[4].rotate(180, pts[6][0], pts[6][1]);

// for 3, we need to compute where K ended up. it was rotated 180 around H,
// so K' = 2H - K
var K_ = [2 * pts[7][0] - pts[10][0], 2 * pts[7][1] - pts[10][1]];
moveAlong(pieces[3], pts[10], K_);

verticalAlign([leftGroup, rightGroup]);

// Shrink and save
asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/square-to-pentagon.svg");

// -------------------------------------
// Diagram: Star <-> Triangle Tangrams
// -------------------------------------

canvas.clear();


//                A                      
//               / \                        
//             M/ 3 \                       
//             / -_  \                      
//            /    - _\                     
// K---------L       __B---------C   
//  \             _--           /           
//   \    1    _--             /             
//    \     _--               /              
//     \ _--                 /               
//      J_           0      D        
//     /  --_                \              
//    /      --_              \            
//   /    2     --_            \            
//  /              --_          \           
// I---------H        _F---------E     
//            \    _- /                      
//             \ _-  /                       
//             N\ 4 /                        
//               \ /                         
//                G                         
//                                           
function makeStarPoints() {
	var sqrt3 = Math.sqrt(3);
	var range6 = [0, 1, 2, 3, 4, 5];

	function polar(radius, angle) {
		return [radius * Math.cos(angle), radius * Math.sin(angle)];
	}

	var innerPoints = range6.map(x => polar(sqrt3 / 3, x * Math.PI / 3));
	var outerPoints = range6.map(x => polar(1, (x + 0.5) * Math.PI / 3));

	var [D, B, L, J, H, F] = innerPoints;
	var [C, A, K, I, G, E] = outerPoints;

	var M = get_midpoint(A, L);
	var N = get_midpoint(G, H);

	return [A, B, C, D, E, F, G, H, I, J, K, L, M, N];
}
// flip y-coords so it's right side up
pts = makeStarPoints().map(pt => [pt[0], -pt[1]]);
var pieceDefs = [["BCDEFJ", GREEN], ["BJKLM", RED], ["FNHIJ", LT_BLUE],
["ABM", PURPLE], ["FNG", YELLOW]];

var leftGroup = canvas.group();
makePieces(leftGroup, pts, 0.03, pieceDefs);

var rightGroup = canvas.group().dx(3);
var pieces = makePieces(rightGroup, pts, 0.03, pieceDefs);

// we keep piece 0 in place

moveAlong(pieces[1], pts[10], pts[3]);
pieces[1].rotate(-60, pts[3][0], pts[3][1]);
moveAlong(pieces[2], pts[8], pts[3]);
pieces[2].rotate(60, pts[3][0], pts[3][1]);

pieces[3].rotate(120, pts[1][0], pts[1][1]);
pieces[4].rotate(-120, pts[5][0], pts[5][1]);

// Shrink and save
asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/star-to-triangle.svg");


// --------------------------
// Diagrams: WBG construction
// --------------------------

canvas.clear();

// -- first, triangulation

var pts = [
	[0, 0], [5, 1], [8, 4], [3, 6], [1, 4], [2, 2]
];

var solidStroke = { width: 0.08 };
var dashedStroke = { width: 0.05, dasharray: 0.2 };
var leftGroup = canvas.group();
leftGroup.polygon(pts).fill(YELLOW).stroke(solidStroke);
leftGroup.line([pts[1], pts[5]]).stroke(dashedStroke);
leftGroup.line([pts[1], pts[4]]).stroke(dashedStroke);
leftGroup.line([pts[2], pts[4]]).stroke(dashedStroke);

var rightGroup = canvas.group().dx(10);
function makeTriangle(group, pts, idxs) {
	return group.polygon(idxs.map(n => pts[n])).fill(YELLOW).stroke(solidStroke);
}
makeTriangle(rightGroup, pts, [0, 1, 5]).dmove(-0.3, -0.5);
makeTriangle(rightGroup, pts, [1, 4, 5]).dmove(-0.2, -0.1);
makeTriangle(rightGroup, pts, [1, 2, 4]).dmove(0.2, 0);
makeTriangle(rightGroup, pts, [2, 3, 4]).dmove(0.2, 0.4);

asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/wbg-1.svg");

// -- next, triangle -> rectangle

canvas.clear();
var [A, B, C] = [pts[1], pts[2], pts[4]];
var D = get_midpoint(A, B);
var E = get_midpoint(A, C);
var midline = make_line(D, E);
var F = drop_onto(A, midline);

var leftGroup = canvas.group();
leftGroup.polygon([A, B, C]).fill(YELLOW).stroke(solidStroke);
leftGroup.line([D, E]).stroke(dashedStroke);
leftGroup.line([A, F]).stroke(dashedStroke);

var G = drop_onto(C, midline);
var H = drop_onto(B, midline);
var rightGroup = canvas.group().dx(10);
rightGroup.polygon([H, B, C, G]).fill(YELLOW).stroke(solidStroke);
rightGroup.line([B, D]).stroke(dashedStroke);
rightGroup.line([C, E]).stroke(dashedStroke);

asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/wbg-2.svg");

// -- next, rectangle -> half-rectangle

canvas.clear();

var leftGroup = canvas.group();
var rightGroup = canvas.group().dmove(10, -1.5 / 2);

leftGroup.rect(7, 1.5).fill(YELLOW).stroke(solidStroke);
leftGroup.line(3.5, 0, 3.5, 1.5).stroke(dashedStroke);

rightGroup.rect(3.5, 3).fill(YELLOW).stroke(solidStroke);
rightGroup.line(0, 1.5, 3.5, 1.5).stroke(dashedStroke);

asset_utils.shrinkCanvas(canvas, 0.1);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/wbg-3.svg");

// -- lastly, rectangle -> rectangle with width 1 (but we'll make it 2 here
// because units are made up)

canvas.clear();

var leftGroup = canvas.group();
var rightGroup = canvas.group().dx(6);

var w = 3.5;
var h = 3;
var t = 2; // target height
var slideY = h - t;
var slideX = slideY * w / t;
leftGroup.rect(w, h).fill(YELLOW).stroke(solidStroke);
leftGroup.line(0, slideY, w, h).stroke(dashedStroke);
leftGroup.line(w, t, w - slideX, t).stroke(dashedStroke);

rightGroup.rect(w + slideX, t).fill(YELLOW).stroke(solidStroke);
rightGroup.line(0, 0, w, h - slideY).stroke(dashedStroke);
rightGroup.line(slideX, 0, slideX, slideY).stroke(dashedStroke);
rightGroup.dy(slideY / 2);

// shrink now, remember, this breaks around tex objects
asset_utils.shrinkCanvas(canvas, 0.1);

// make math labels
var u = asset_utils.makeMathSvg(canvas, "u", 0.7);
var one = asset_utils.makeMathSvg(canvas, "1", 0.7);
var ell = asset_utils.makeMathSvg(canvas, "\\ell", 0.7);
var uell = asset_utils.makeMathSvg(canvas, "u \\ell", 0.7);

// place initial copies
u.move(-0.6, 0.3);
one.move(-0.6, 1.8);
ell.move(1.7, -0.7);
uell.move(2.4, 1.3);

// go around 'stamping' text
u.clone().move(3.7, 2.3);
one.clone().move(3.7, 0.6);

// move everything to the other group
u = u.clone().addTo(rightGroup).move(2, 0.3);
one = one.clone().addTo(rightGroup).move(-0.7, 0.6);
ell = ell.clone().addTo(rightGroup).move(3.3, -0.7);
uell = uell.clone().addTo(rightGroup).move(0.6, -0.7);

var viewbox = canvas.viewbox();
canvas.viewbox(viewbox.x - 1, viewbox.y - 1, viewbox.width + 2, viewbox.height + 1);

asset_utils.saveImgToFile(canvas, "../content/images/dehn/wbg-4.svg");

// ----------------------
// Diagrams: Edge cutting
// ----------------------

canvas.clear();

var pts = [[2, 1], [10, 0], [5, 3], [-3, 4], [15, 5], [11, 8]];

// add points on lines
pts.push(interpolate(pts[0], pts[1], 0.1));
pts.push(interpolate(pts[1], pts[2], 0.5));
pts.push(interpolate(pts[4], pts[5], 0.7));

var cutStroke = { color: RED, width: 0.1, dasharray: 0.2 };
var thickStroke = { width: 0.3 };

var leftGroup = canvas.group();
makePieces(
	leftGroup, pts, 0.1,
	[["ABCD", LT_BLUE], ["BCFE", DK_BLUE], ["CDF", MED_BLUE]]
);
leftGroup.line([pts[1], pts[2]]).stroke(thickStroke);
leftGroup.polyline([pts[6], pts[7], pts[8]]).fill("none").stroke(cutStroke);

var rightGroup1 = canvas.group().dmove(25, 0);
makePieces(
	rightGroup1, pts, 0.1,
	[["GBH", LT_BLUE], ["BHIE", DK_BLUE], ["GHI", PURPLE]]
);
rightGroup1.line([pts[1], pts[7]]).stroke(thickStroke);

var rightGroup2 = canvas.group().dmove(23, 1);
makePieces(
	rightGroup2, pts, 0.1,
	[["AGHCD", LT_BLUE], ["HCFI", DK_BLUE], ["CDF", MED_BLUE]]
);
rightGroup2.line([pts[7], pts[2]]).stroke(thickStroke);

// before math
asset_utils.shrinkCanvas(canvas, 0.1);

var mathLength = asset_utils.makeMathSvg(canvas, "\\ell = \\ell_1 + \\ell_2", 2);
mathLength.move(13, -2);

var mathAngle = asset_utils.makeMathSvg(canvas, "\\theta = \\theta_1 = \\theta_2", 2);
mathAngle.move(13, 8);

asset_utils.adjustCanvas(canvas, 0, 0, 3, 2);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/edge-cut-transverse.svg");

// -- edge-on cut --

canvas.clear();

var pts = pts.slice(0, 6);

// add points on lines
pts.push(interpolate(pts[3], pts[5], 2 / 3));
pts.push([12, 3]); // off in the distance a bit

var leftGroup = canvas.group();
makePieces(
	leftGroup, pts, 0.1,
	[["ABCD", LT_BLUE], ["BCFE", DK_BLUE], ["CDF", MED_BLUE]]
);
leftGroup.line([pts[1], pts[2]]).stroke(thickStroke);
leftGroup.polyline([pts[1], pts[2], pts[6]]).fill("none").stroke(cutStroke);

var rightGroup1 = canvas.group().dmove(23, 0);
makePieces(
	rightGroup1, pts, 0.1,
	[["ABCD", LT_BLUE], ["CDG", MED_BLUE], ["BCGH", PURPLE]]
);
rightGroup1.line([pts[1], pts[2]]).stroke(thickStroke);

var rightGroup2 = canvas.group().dmove(25, 1);
makePieces(
	rightGroup2, pts, 0.1,
	[["BCFE", DK_BLUE], ["CFG", MED_BLUE]]
);
rightGroup2.line([pts[1], pts[2]]).stroke(thickStroke);

// before math
asset_utils.shrinkCanvas(canvas, 0.1);

var mathLength = asset_utils.makeMathSvg(canvas, "\\ell = \\ell_1 = \\ell_2", 2);
mathLength.move(13, -2);

var mathAngle = asset_utils.makeMathSvg(canvas, "\\theta = \\theta_1 + \\theta_2", 2);
mathAngle.move(13, 8);

asset_utils.adjustCanvas(canvas, 0, 0, 3, 2);
asset_utils.saveImgToFile(canvas, "../content/images/dehn/edge-cut-lengthwise.svg");