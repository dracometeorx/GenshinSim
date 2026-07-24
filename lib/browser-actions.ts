export type SharePayload = {
  title: string;
  text: string;
};

export type BrowserActions = {
  share?: (payload: SharePayload) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
};

export type ShareOutcome = "shared" | "copied" | "cancelled";

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export async function copyText(
  text: string,
  writeText?: BrowserActions["writeText"],
) {
  if (!writeText) {
    throw new Error("Clipboard API is unavailable");
  }
  await writeText(text);
}

export async function shareOrCopy(
  payload: SharePayload,
  actions: BrowserActions,
): Promise<ShareOutcome> {
  if (actions.share) {
    try {
      await actions.share(payload);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      throw error;
    }
  }

  await copyText(payload.text, actions.writeText);
  return "copied";
}
