// The spec-file locator of C002-T-006: active change folder first, then `_living/`, then the archived
// change folder; a failure names the paths it tried.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { changeFolder, specFile } from "../../helpers/spec-file.ts";
import { makeWorkspace } from "../../integration/cli/helpers.ts";

const REL = "10-spec/50-interfaces/errors.md";

test("specFile finds the file in the active change folder, before _living/", () => {
  const ws = makeWorkspace({
    ".sdd/007-some-change/10-spec/50-interfaces/errors.md": "active",
    ".sdd/_living/10-spec/50-interfaces/errors.md": "living",
  });
  try {
    assert.equal(specFile("007", REL, ws.root), join(ws.root, ".sdd", "007-some-change", "10-spec", "50-interfaces", "errors.md"));
    assert.equal(changeFolder("007", ws.root), join(ws.root, ".sdd", "007-some-change"));
  } finally {
    ws.cleanup();
  }
});

test("specFile falls back to _living/ when the change folder is gone or lacks the file", () => {
  const ws = makeWorkspace({
    ".sdd/_living/10-spec/50-interfaces/errors.md": "living",
    ".sdd/008-other/change.md": "---\nid: CHG-008\n---\n",
    ".sdd/_living/10-spec/50-interfaces/x.schema.json": "{}",
  });
  try {
    assert.equal(specFile("007", REL, ws.root), join(ws.root, ".sdd", "_living", "10-spec", "50-interfaces", "errors.md"));
    assert.equal(specFile("008", "10-spec/50-interfaces/x.schema.json", ws.root), join(ws.root, ".sdd", "_living", "10-spec", "50-interfaces", "x.schema.json"));
  } finally {
    ws.cleanup();
  }
});

test("specFile and changeFolder find an archived change under _archive/", () => {
  const ws = makeWorkspace({ ".sdd/_archive/007-some-change/10-spec/50-interfaces/errors.md": "archived" });
  try {
    assert.equal(specFile("007", REL, ws.root), join(ws.root, ".sdd", "_archive", "007-some-change", "10-spec", "50-interfaces", "errors.md"));
    assert.equal(changeFolder("007", ws.root), join(ws.root, ".sdd", "_archive", "007-some-change"));
  } finally {
    ws.cleanup();
  }
});

test("specFile fails naming the change-folder path and the _living/ path when neither exists", () => {
  const ws = makeWorkspace({ ".sdd/007-some-change/change.md": "x" });
  try {
    assert.throws(
      () => specFile("007", REL, ws.root),
      (e: Error) =>
        e.message.includes(join(ws.root, ".sdd", "007-some-change", "10-spec", "50-interfaces", "errors.md")) &&
        e.message.includes(join(ws.root, ".sdd", "_living", "10-spec", "50-interfaces", "errors.md")),
    );
    assert.throws(() => specFile("009", REL, ws.root), (e: Error) => e.message.includes(join(ws.root, ".sdd", "009-*")) && e.message.includes("_living"));
    assert.throws(() => changeFolder("009", ws.root), /change 009 not found/);
    assert.throws(() => specFile("7", REL, ws.root), /three digits/);
  } finally {
    ws.cleanup();
  }
});

test("specFile finds this repository's CHG-001 contracts", () => {
  assert.match(specFile("001", REL), /errors\.md$/);
});
