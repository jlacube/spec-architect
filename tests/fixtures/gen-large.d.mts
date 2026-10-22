// Types of the fx-large generator (tests/fixtures/gen-large.mjs) for the TypeScript tests.
export declare const CHANGES: number;
/** Writes fx-large (or its first `changes` changes) under `root/.sdd/`; returns the number of artifact files. */
export declare function generateLarge(root: string, changes?: number): number;
/** Sets gate G3 approved and every task done in generated change `nnn` (default "001"), so `sdd archive` accepts it. */
export declare function makeArchivable(root: string, nnn?: string): void;
