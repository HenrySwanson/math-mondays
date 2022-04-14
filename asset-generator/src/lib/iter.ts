"use strict";

export function range(a: number, b: number) {
    if (b < a) {
        return [];
    }
    return Array(b - a).fill(0).map((_, i) => i + a);
}

export function max_by<T>(array: T[], key: (t: T) => number): T {
    return array.reduce((a, b) => key(a) >= key(b) ? a : b);
}

export function zip<T, U>(ts: T[], us: U[]): [T, U][] {
    let len = Math.min(ts.length, us.length);
    let out : [T, U][] = [];
    for(let i = 0; i < len; i++) {
        out.push([ts[i], us[i]]);
    }
    return out;
}