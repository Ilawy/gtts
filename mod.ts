import type { LANGUAGES } from "./src/languages.ts";
import { writeAll } from "./deps.ts";

const GOOGLE_TTS_URL = "http://translate.google.com/translate_tts";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/536.26.17 (KHTML like Gecko) Version/6.0.2 Safari/536.26.17",
};

function tokenize(text: string) {
  return text
    .split(/¡|!|\(|\)|\[|\]|\¿|\?|\.|\,|\;|\:|\—|\«|\»|\n/)
    .filter((p) => p);
}

/**
 * The options for TTS
 */
export interface Options {
  language: keyof typeof LANGUAGES;
}

/**
 * Convert text to speech and save to a .wav file
 * @example
 * ```typescript
 * await gtts("hello text to speech", { language: "en-us" });
 * ```
 */
export default async function gtts(
  text: string,
  options?: Partial<Options>
): Promise<Uint8Array> {
  const { resolve, reject, promise } = Promise.withResolvers<Uint8Array>();
  const config: Options = {
    ...{
      language: "en-us",
    },
    ...options,
  };
  const textParts = tokenize(text);
  const chunks: Uint8Array[] = [];

  for await (const [i, part] of Object.entries(textParts)) {
    const encodedText = encodeURIComponent(part);
    const args = `?ie=UTF-8&tl=${config.language}&q=${encodedText}&total=${textParts.length}&idx=${i}&client=tw-ob&textlen=${encodedText.length}`;
    const url = GOOGLE_TTS_URL + args;
    try {
      const req = await fetch(url, {
        headers,
      });
      const buffer = await req.arrayBuffer();
      const data = new Uint8Array(buffer);
      chunks.push(data);
    } catch (e) {
      reject(e);
    }
  }
  const buffer = new Blob(chunks, { type: "audio/wav" });
  resolve(new Uint8Array(await buffer.arrayBuffer()));

  return promise;
}

export async function save(
  path: string,
  text: string,
  options?: Partial<Options>
): Promise<void> {
  try {
    await Deno.remove(path);
  } catch {
    // swallow error
  }

  const data = await gtts(text, options);

  const file = await Deno.open(path, {
    create: true,
    append: true,
    write: true,
  });

  await writeAll(file, data);

  file.close();
}
