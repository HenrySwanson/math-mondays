"use strict";

import asset_utils = require("../../builder/utils");
import { Builder } from "../../builder/builder";
import * as SVG from "@svgdotjs/svg.js";

const DOT_SIZE = 0.1;
const GRID_SIZE = 6;
const HEAD_STROKE = { color: "#0f0", width: 0.05 };
const TAIL_STROKE = { color: "#f00", width: 0.05 };

function draw_grid(canvas: SVG.Container) {
    // Draw a grid
    for (let i = 0; i <= GRID_SIZE; i++) {
        for (let j = 0; j <= GRID_SIZE; j++) {
            canvas.circle(DOT_SIZE).center(i, -j);
        }
    }

    // Draw the axes
    canvas.line(0, 0, GRID_SIZE, 0).stroke({ color: "#000", width: 0.04 });
    canvas.line(0, 0, 0, -GRID_SIZE).stroke({ color: "#000", width: 0.04 });

    // Draw the diagonal
    canvas.line(0, 0, GRID_SIZE, -GRID_SIZE).stroke({ color: "#000", width: 0.02 });
}

// Drawing the lines spaced adequately away from the dots is hard, so let's
// do it in a function.
function draw_arrow(canvas: SVG.Container, x1: number, y1: number, x2: number, y2: number, stroke: SVG.StrokeData) {
    let eps = 0.1;

    let sx = Math.sign(x2 - x1);
    let sy = Math.sign(y2 - y1);

    let marker = canvas.marker(5, 5, function (add: SVG.Marker) {
        add.polygon("0,0 5,2.5 0,5").fill(stroke.color!);
    });

    canvas.line(
        x1 + eps * sx,
        -y1 - sy * eps,
        x2 - 2 * eps * sx,
        -y2 + 2 * eps * sy
    ).stroke(stroke).marker("end", marker);
}

export let builder = new Builder("wirefly");

builder.register("grid.svg", function (canvas) {
    // Draw a grid
    draw_grid(canvas);

    // Draw the starting path with annotations
    draw_arrow(canvas, 2, 0, 2, 1, HEAD_STROKE);
    draw_arrow(canvas, 2, 1, 3, 0, TAIL_STROKE);
    draw_arrow(canvas, 3, 0, 3, 1, HEAD_STROKE);
    draw_arrow(canvas, 3, 1, 3, 2, HEAD_STROKE);
    draw_arrow(canvas, 3, 2, 5, 0, TAIL_STROKE);
    draw_arrow(canvas, 5, 0, 5, 1, HEAD_STROKE);
    draw_arrow(canvas, 5, 1, 6, 0, TAIL_STROKE);

    canvas.text("H").font({ fill: HEAD_STROKE.color, family: "sans-serif", size: 0.5 }).center(1.5, -0.5);
    canvas.text("T").font({ fill: TAIL_STROKE.color, family: "sans-serif", size: 0.5 }).center(2.5, -1);

    asset_utils.shrinkCanvas(canvas, 0.1);
});

builder.register("diagonal-slide.svg", function (canvas) {
    // Draw a grid
    draw_grid(canvas);

    // Draw a diagonal arrow downwards
    draw_arrow(canvas, 3, 3, 6, 0, TAIL_STROKE);

    canvas.circle(DOT_SIZE * 2).center(5, -1).fill(TAIL_STROKE.color);
    canvas.circle(DOT_SIZE * 2).center(4, -2).fill(TAIL_STROKE.color);

    asset_utils.shrinkCanvas(canvas, 0.1);
});

builder.register("paths-for-six.svg", function (canvas) {
    // Draw a grid
    draw_grid(canvas);

    // Draw all possible paths!
    const PATH_1_STROKE = { color: "#08f", width: 0.05 };
    const PATH_2_STROKE = { color: "#00f", width: 0.05 };
    const PATH_3_STROKE = { color: "#80f", width: 0.05 };
    const OFFSET = 0.07;

    function draw_path(coordinates: number[][], stroke: SVG.StrokeData, offset: number) {
        for (let coords of coordinates) {
            let [x1, y1, x2, y2] = coords;

            if (x1 != x2) {
                y1 += offset;
                y2 += offset;
            }

            if (y1 != y2) {
                x1 += offset;
                x2 += offset;
            }

            draw_arrow(canvas, x1, y1, x2, y2, stroke);
        }
    }

    draw_path(
        [
            [2, 0, 2, 1],
            [2, 1, 3, 0],
            [3, 0, 3, 1],
            [3, 1, 4, 0],
            [4, 0, 4, 1],
            [4, 1, 5, 0],
            [5, 0, 5, 1],
            [5, 1, 6, 0],
        ],
        PATH_1_STROKE,
        -OFFSET,
    );

    draw_path(
        [
            [2, 0, 2, 1],
            [2, 1, 3, 0],
            [3, 0, 3, 1],
            [3, 1, 4, 0],
            [4, 0, 4, 1],
            [4, 1, 4, 2],
            [4, 2, 6, 0]
        ],
        PATH_2_STROKE,
        0,
    );

    draw_path(
        [
            [2, 0, 2, 1],
            [2, 1, 3, 0],
            [3, 0, 3, 1],
            [3, 1, 3, 2],
            [3, 2, 5, 0],
            [5, 0, 5, 1],
            [5, 1, 6, 0]
        ],
        PATH_3_STROKE,
        OFFSET,
    );

    asset_utils.shrinkCanvas(canvas, 0.1);
});
