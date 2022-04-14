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