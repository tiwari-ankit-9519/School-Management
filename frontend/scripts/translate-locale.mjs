import fs from "fs";

const LANGUAGES = ["hi"];
const SOURCE = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

async function translateText(text, targetLang) {
  if (!text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0]?.map((item) => item[0]).join("") ?? text;
  } catch {
    console.warn(`  ⚠ Failed: "${text}"`);
    return text;
  }
}

async function translateObject(obj, lang) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      console.log(`  namespace: ${key}`);
      result[key] = await translateObject(value, lang);
    } else {
      result[key] = await translateText(value, lang);
    }
  }
  return result;
}

for (const lang of LANGUAGES) {
  console.log(`\n🌐 Translating → ${lang}`);
  const translated = await translateObject(SOURCE, lang);
  fs.writeFileSync(
    `messages/${lang}.json`,
    JSON.stringify(translated, null, 2),
    "utf8",
  );
  console.log(`✅ messages/${lang}.json written`);
}
