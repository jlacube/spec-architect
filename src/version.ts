// Plugin version, injected by the build (scripts/build.mjs and scripts/test.mjs define __SDD_VERSION__).
declare const __SDD_VERSION__: string | undefined;

export const VERSION: string = typeof __SDD_VERSION__ === "string" ? __SDD_VERSION__ : "0.0.0-dev";
export const TOOL = `architect-plugin@${VERSION}`;
