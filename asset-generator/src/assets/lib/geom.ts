"use strict";

export class Point {
    constructor(public x: number, public y: number) { }

    toTuple(): [number, number] {
        return [this.x, this.y];
    }
}
// we store a line as (A, B, C) where Ax + By = C
export class Line {
    constructor(public a: number, public b: number, public c: number) { }
    static horizontal(y: number): Line {
        return new Line(0, 1, y);
    }
};

export function make_line(p: Point, q: Point): Line {
    // slope = -A/B = (y2-y1)/(x2-x1), so we can say A = y2 - y1 and -B = x2 - x1
    // that leaves C solvable
    let a = q.y - p.y;
    let b = -(q.x - p.x);
    let c = a * p.x + b * p.y;
    return { a: a, b: b, c: c };
}

export function intersect_lines(l1: Line, l2: Line): Point {
    // if the lines are Ax + By = E and Cx + Dy = F, then we're trying to solve
    // the usual matrix equation: ABCD * [x, y] = [E, F]
    // solution is 1/det [[D, -B], [-C, A]] [E, F]
    let det = l1.a * l2.b - l1.b * l2.a;

    return new Point(
        (l2.b * l1.c - l1.b * l2.c) / det,
        (-l2.a * l1.c + l1.a * l2.c) / det
    );
}

export function parallel_to(p: Point, line: Line): Line {
    // point (x, y) and line Ax + By = C
    // slope doesn't change, so we just evaluate C
    return new Line(
        line.a,
        line.b,
        line.a * p.x + line.b * p.y
    );
}

export function perp_to(p: Point, line: Line): Line {
    // point (x, y) and line Ax + By = C
    // slope changes by 90, so (A, B) -> (-B, A), then we evaluate C
    return new Line(
        - line.b,
        line.a,
        -line.b * p.x + line.a * p.y
    );
}

export function drop_onto(p: Point, line: Line): Point {
    // return p dropped perpendicularly onto the line
    return intersect_lines(line, perp_to(p, line));
}

export function polar(radius: number, angle: number): Point {
    return new Point(
        radius * Math.cos(angle), radius * Math.sin(angle)
    );
}

export function interpolate(p: Point, q: Point, t: number): Point {
    return new Point(
        p.x * (1 - t) + q.x * t,
        p.y * (1 - t) + q.y * t
    );
}


export function get_midpoint(p: Point, q: Point): Point {
    return interpolate(p, q, 0.5);
}