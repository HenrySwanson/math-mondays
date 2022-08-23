"use strict";

export class Tree<T> {
    parent: Tree<T> | null
    children: Tree<T>[]
    payload: T

    constructor(payload: T, children: Tree<T>[]) {
        this.parent = null;
        this.children = children;
        this.payload = payload;
        children.forEach(child => child.parent = this);
    }

    index(...idxs: number[]): Tree<T> | null {
        if (idxs.length === 0) {
            return this;
        }

        let i = idxs[0];
        if (i < this.children.length) {
            return this.children[i].index(...idxs.slice(1));
        } else {
            return null;
        }
    }

    makeCopy(): Tree<T> {
        // The copy is not attached to the parent!
        return new Tree(
            this.payload,
            this.children.map(child => child.makeCopy())
        )
    }

    insertSubtree(idx: number, subtree: Tree<T>): void {
        this.children.splice(idx, 0, subtree);
        subtree.parent = this;
    }

    appendChild(payload: T): Tree<T> {
        let child = new Tree(payload, []);
        child.parent = this;
        this.children.push(child);
        return child;
    }

    remove() {
        // Calling this on the root does nothing
        let parent = this.parent;
        if (parent !== null) {
            let idx = parent.children.indexOf(this);
            parent.children.splice(idx, 1);
            this.parent = null;
        }
    }

    // TODO: decide if i want the X versions or not

    forEachPreorder(fn: (t: T, depth: number) => void, depth: number = 0): void {
        fn(this.payload, depth);
        this.children.forEach(child => child.forEachPreorder(fn, depth + 1));
    }

    forEachPreorderX(fn: (t: Tree<T>, depth: number) => void, depth: number = 0): void {
        fn(this, depth);
        this.children.forEach(child => child.forEachPreorderX(fn, depth + 1));
    }

    zip<U>(other: Tree<U>): Tree<[T, U]> {
        let children: Tree<[T, U]>[] = [];
        let n = Math.min(this.children.length, other.children.length);
        for (let i = 0; i < n; i++) {
            children.push(this.children[i].zip(other.children[i]));
        }
        return new Tree(
            [this.payload, other.payload],
            children
        );
    }

    zipX<U>(other: Tree<U>): Tree<[Tree<T>, Tree<U>]> {
        let children: Tree<[Tree<T>, Tree<U>]>[] = [];
        let n = Math.min(this.children.length, other.children.length);
        for (let i = 0; i < n; i++) {
            children.push(this.children[i].zipX(other.children[i]));
        }
        return new Tree(
            [this, other],
            children
        );
    }

    map<U>(fn: (t: T) => U): Tree<U> {
        return new Tree(
            fn(this.payload),
            this.children.map(child => child.map(fn))
        );
    }

    mapX<U>(fn: (t: Tree<T>) => U): Tree<U> {
        return new Tree(
            fn(this),
            this.children.map(child => child.mapX(fn))
        );
    }
}