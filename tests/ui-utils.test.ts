import assert from "node:assert/strict";
import test from "node:test";
import { parseNumericDraft } from "../lib/numeric-input.ts";
import {
  copyText,
  shareOrCopy,
} from "../lib/browser-actions.ts";

test("parses temporary negative, trailing-decimal, and empty drafts", () => {
  assert.equal(parseNumericDraft("-20", -100, 1000), -20);
  assert.equal(parseNumericDraft("1.", -100, 1000), 1);
  assert.equal(parseNumericDraft("", -100, 1000), null);
  assert.equal(parseNumericDraft("not-a-number", -100, 1000), null);
  assert.equal(parseNumericDraft("2000", -100, 1000), 1000);
});

test("reports unavailable and failed clipboard writes", async () => {
  await assert.rejects(copyText("payload"), /unavailable/);
  await assert.rejects(
    copyText("payload", async () => {
      throw new Error("denied");
    }),
    /denied/,
  );
});

test("distinguishes share cancellation from failure and fallback copy", async () => {
  assert.equal(
    await shareOrCopy(
      { title: "result", text: "payload" },
      {
        share: async () => {
          throw { name: "AbortError" };
        },
      },
    ),
    "cancelled",
  );

  let copied = "";
  assert.equal(
    await shareOrCopy(
      { title: "result", text: "payload" },
      {
        writeText: async (text) => {
          copied = text;
        },
      },
    ),
    "copied",
  );
  assert.equal(copied, "payload");
});
