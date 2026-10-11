// Types of the fx-large generator (tests/fixtures/gen-large.mjs) for the TypeScript tests.
export declare const CHANGES: number;
/** Writes fx-large (or its first `changes` changes) under `root/.sdd/`; returns the number of artifact files. */
export declare function generateLarge(root: string, changes?: number): number;
