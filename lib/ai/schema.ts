import { z } from "zod";

export const saveMemoryInput = z.object({
  content: z.string().describe("A strict 1-sentence summary of the fact, note, or preference to save securely in the brain."),
});
