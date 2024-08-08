import gtts from "./mod.ts";
import { which } from "@david/which";

Deno.test("generate and play", async () => {
  const result = await gtts("If you can hear me, this test passed.");
  await Deno.writeFile("test.wav", result);
  if (await which("ffplay")) {
    const proc = new Deno.Command("ffplay", {
      args: ["-autoexit", "test.wav"],
    });
    await proc.output();
  } else {
    throw new Error("ffplay not found");
  }
  await Deno.remove("test.wav");
});
