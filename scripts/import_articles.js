/**
 * Article Import Script
 * 
 * This script automates the process of importing new articles into the database.
 * It performs the following steps:
 * 1. Reads metadata from 'new-articles/articles.json'.
 * 2. Determines the next available ID by checking 'data/database.js'.
 * 3. Copies and renames article images to the 'public/images/articles/' directory.
 * 4. Runs OCR (Optical Character Recognition) on the cropped/edited images to extract text.
 * 5. Corrects OCR errors using OpenAI's GPT-4o.
 * 6. Generates a concise summary (20-30 words) using OpenAI's GPT-4o.
 * 7. Appends the new article data to 'data/database.js'.
 * 
 * Usage:
 * 1. Place new images and articles.json in the 'new-articles/' directory.
 * 2. Ensure OPENAI_API_KEY is set in your environment.
 * 3. Run: node scripts/import_articles.js
 */

import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";

const databasePath = path.resolve("data/database.js");
const newArticlesDir = path.resolve("new-articles");
const newArticlesJsonPath = path.join(newArticlesDir, "articles.json");
const publicImagesDir = path.resolve("public/images/articles");

// Ensure the target directory exists
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

function formatJS(obj) {
  const json = JSON.stringify(obj, null, 2);
  // Unquote keys to match project style
  return json.replace(/^(\s+)"(\w+)":/gm, "$1$2:");
}

async function loadDb() {
  const content = fs.readFileSync(databasePath, "utf8");
  const tmpFile = path.resolve("data/tmp_db_import.mjs");
  fs.writeFileSync(tmpFile, content);
  const { db } = await import("../data/tmp_db_import.mjs");
  fs.unlinkSync(tmpFile);
  return db;
}

async function saveDb(db) {
  const newContent = `export const db = ${formatJS(db)};\n`;
  fs.writeFileSync(databasePath, newContent);
}

async function runOcr(imagePath) {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

async function correctOcrText(text, apiKey) {
  console.log("Correcting OCR text using LLM...");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a transcription assistant specializing in 19th-century sports news. Your task is to correct errors in the provided OCR text. Fix typos, punctuation, and layout issues while preserving the original content and historical tone. Do not add any commentary, extra text, or formatting like markdown code blocks. Just provide the corrected text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.choices[0].message.content.trim();
}

async function generateTitle(text, apiKey) {
  console.log("Generating title using LLM...");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a transcription assistant specializing in 19th-century sports news. Based on the provided article text, generate a concise, descriptive title for the article. The title should be brief (ideally 3-8 words) and capture the main subject of the article. Do not use markdown, quotes, or any extra commentary. Just provide the title text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 50,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.choices[0].message.content.trim().replace(/^"|"$/g, "");
}

async function generateSummary(article, apiKey) {
  console.log(`Generating summary for: ${article.title}...`);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a historian specializing in 19th-century sports. Provide a thoughtful, engaging summary of the news article. Your summary MUST be between 20 and 30 words. Focus on key figures (like Tom Allen, Mike McCoole, Jem Mace), the specific event, and the historical context. Do not use generic phrases like 'This article discusses...'",
        },
        {
          role: "user",
          content: `Title: ${article.title}\n\nArticle Text: ${(
            article.text || ""
          ).substring(0, 4000)}`,
        },
      ],
      max_tokens: 150,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.choices[0].message.content.trim();
}

async function importArticles() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Error: OPENAI_API_KEY environment variable is not set.");
    return;
  }

  console.log("Loading database...");
  const db = await loadDb();

  console.log("Loading new articles metadata...");
  const newArticles = JSON.parse(fs.readFileSync(newArticlesJsonPath, "utf8"));

  // Determine next ID
  const lastId = Math.max(...db.map((a) => parseInt(a.id, 10)));
  let nextIdInt = lastId + 1;

  for (const newArticle of newArticles) {
    const id = String(nextIdInt).padStart(3, "0");
    console.log(`\nImporting article ${id}: ${newArticle.title}`);

    const targetEditedName = `image-${id}.jpg`;
    const targetFullName = `image-${id}b.jpg`;

    const sourceEditedPath = path.join(
      newArticlesDir,
      newArticle.localCopyEdited
    );
    const sourceFullPath = path.join(newArticlesDir, newArticle.localCopyFull);

    const targetEditedPath = path.join(publicImagesDir, targetEditedName);
    const targetFullPath = path.join(publicImagesDir, targetFullName);

    // Copy images
    if (fs.existsSync(sourceEditedPath)) {
      fs.copyFileSync(sourceEditedPath, targetEditedPath);
      console.log(`Copied edited image to ${targetEditedPath}`);
    } else {
      console.warn(`Source edited image not found: ${sourceEditedPath}`);
    }

    if (fs.existsSync(sourceFullPath)) {
      fs.copyFileSync(sourceFullPath, targetFullPath);
      console.log(`Copied full image to ${targetFullPath}`);
    } else {
      console.warn(`Source full image not found: ${sourceFullPath}`);
    }

    // Prepare DB entry
    const entry = {
      ...newArticle,
      id,
      localCopyEdited: `images/articles/${targetEditedName}`,
      localCopyFull: `images/articles/${targetFullName}`,
      text: "",
      summary: "",
    };

    // Run OCR
    if (fs.existsSync(targetEditedPath)) {
      console.log("Running OCR...");
      let text = await runOcr(targetEditedPath);
      // Clean text
      entry.text = text
        .replace(/\|/g, "") // Remove pipes
        .replace(/\n\s*\n\s*\n+/g, "\n\n") // Consolidate 3+ newlines to 2
        .trim();
      console.log("OCR complete.");

      // Correct OCR text using LLM
      try {
        entry.text = await correctOcrText(entry.text, apiKey);
        console.log("OCR text corrected.");

        // Generate title if it's missing or generic (like 'untitled')
        if (!entry.title || entry.title.toLowerCase() === "untitled" || entry.title === newArticle.publication) {
          entry.title = await generateTitle(entry.text, apiKey);
          console.log(`Title generated: ${entry.title}`);
        }
      } catch (err) {
        console.error("Error correcting OCR text or generating title:", err.message);
      }
    }

    // Generate Summary
    if (entry.text) {
      try {
        entry.summary = await generateSummary(entry, apiKey);
        console.log("Summary generated.");
      } catch (err) {
        console.error("Error generating summary:", err.message);
      }
    }

    db.push(entry);
    nextIdInt++;

    // Save progress after each article
    await saveDb(db);
    console.log(`Article ${id} added to database.`);

    // Small delay to avoid OpenAI rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nAll articles imported successfully.");
}

importArticles().catch(console.error);
