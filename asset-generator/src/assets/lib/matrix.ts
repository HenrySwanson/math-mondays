"use strict";

import { max_by, range } from "./iter";

export class Matrix {

    private constructor(
        public rows: number[][],
        public nRows: number,
        public nCols: number) { }

    static fromRows(rows: number[][]): Matrix {
        return new Matrix(rows, rows.length, rows[0].length);
    }

    getRow(n: number): number[] {
        return this.rows[n].slice();
    }

    getCol(n: number): number[] {
        return this.rows.map(r => r[n]);
    }

    swapRows(n: number, m: number) {
        let tmp = this.rows[n];
        this.rows[n] = this.rows[m];
        this.rows[m] = tmp;
    }

    scaleRow(n: number, a: number) {
        for (let j = 0; j < this.nCols; j++) {
            this.rows[n][j] *= a;
        }
    }

    addmulRow(n: number, m: number, a: number) {
        for (let j = 0; j < this.nCols; j++) {
            this.rows[n][j] += this.rows[m][j] * a;
        }
    }

    rref(): void {
        let pivotRow = 0;
        let pivotColumn = 0;
        while (pivotRow < this.nRows && pivotColumn < this.nCols) {
            // Find the pivot for this column
            let [valMax, iMax] = max_by(
                range(pivotRow, this.nRows).map(i => [this.rows[i][pivotColumn], i]),
                tup => Math.abs(tup[0])
            );

            if (valMax == 0) {
                // No pivot in this column
                pivotColumn += 1;
            } else {
                // Swap this row into the pivot row
                this.swapRows(pivotRow, iMax);

                // Normalize this row
                this.scaleRow(pivotRow, 1 / this.rows[pivotRow][pivotColumn]);

                // For all rows other than pivot, clear the column
                for (let i = 0; i < this.nRows; i++) {
                    if (i == pivotRow) {
                        continue;
                    }

                    this.addmulRow(i, pivotRow, -this.rows[i][pivotColumn]);
                }
                pivotRow += 1;
                pivotColumn += 1;
            }
        }
    }

}