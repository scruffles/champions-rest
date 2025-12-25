import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";

const databasePath = path.resolve("data/database.js");
const imagesDir = path.resolve("public");

async function processArticles() {
  console.log("Reading database...");
  let content = fs.readFileSync(databasePath, "utf8");

  // This is a bit hacky but should work for this specific file structure
  // We want to parse the array after 'export const db = '
  const dbMatch = content.match(/export const db = (\[[\s\S]*\]);?/);
  if (!dbMatch) {
    console.error("Could not find db array in database.js");
    return;
  }

  // We need to evaluate the array. Since it's in a JS file, we can't just JSON.parse it easily
  // because it might have trailing commas, template literals, etc.
  // For safety in this environment, we might want to use a more robust way to update it.

  // Let's try to parse it using a trick: wrap it in a temporary file and import it
  const tmpFile = path.resolve("data/tmp_db.mjs");
  fs.writeFileSync(tmpFile, content);

  const { db } = await import("../data/tmp_db.mjs");
  fs.unlinkSync(tmpFile);

  const worker = await createWorker("eng");

  let count = 0;
  // LIMIT can be set to Infinity to process all remaining articles
  const LIMIT = Infinity; 

  for (let article of db) {
    if (article.localCopyEdited && !article.text) {
      if (count >= LIMIT) break;
      const imagePath = path.join(imagesDir, article.localCopyEdited);
      if (fs.existsSync(imagePath)) {
        console.log(
          `Processing image: ${article.localCopyEdited} (ID: ${article.id})`,
        );
        try {
          const {
            data: { text },
          } = await worker.recognize(imagePath);
          article.text = text.trim();
          count++;
          console.log(`OCR complete for ${article.id} (${count}/${LIMIT})`);

          // Save progress after each successful OCR to avoid data loss on timeout
          const newDbContent = `export const db = ${JSON.stringify(db, null, 2)};\n`;
          fs.writeFileSync(databasePath, newDbContent);
        } catch (err) {
          console.error(`Error processing ${imagePath}:`, err);
        }
      } else {
        console.warn(`Image not found: ${imagePath}`);
      }
    }
  }

  await worker.terminate();

  if (count > 0) {
    console.log(`Successfully processed ${count} articles.`);
  } else {
    console.log("No articles needed OCR.");
  }
}

processArticles().catch(console.error);
