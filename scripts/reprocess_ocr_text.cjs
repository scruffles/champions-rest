const fs = require('fs');
const path = require('path');

const databasePath = path.resolve('data/database.js');

function formatJS(obj) {
  const json = JSON.stringify(obj, null, 2);
  // Unquote keys to match project style
  return json.replace(/^(\s+)"(\w+)":/gm, '$1$2:');
}

async function correctOcrText(text, apiKey) {
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

async function reprocess() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    return;
  }

  console.log('Reading database...');
  const content = fs.readFileSync(databasePath, 'utf8');

  // Load the DB
  const tmpFile = path.resolve('data/tmp_db_reprocess.cjs');
  const cjsContent = content.replace('export const db =', 'module.exports.db =');
  fs.writeFileSync(tmpFile, cjsContent);
  const { db } = require(tmpFile);
  fs.unlinkSync(tmpFile);

  // We want to reprocess articles that were recently imported (IDs >= 268)
  // or any that look like they have poor OCR (heuristic: weird characters)
  const articlesToReprocess = db.filter(a => {
    const idInt = parseInt(a.id, 10);
    // Focus on the recently added ones as requested
    return idInt >= 268 && a.text && a.text.length > 0;
  });

  console.log(`Found ${articlesToReprocess.length} articles to reprocess.`);

  let updatedCount = 0;
  for (const article of articlesToReprocess) {
    console.log(`Reprocessing text for Article ${article.id}: ${article.title}...`);
    try {
      const originalText = article.text;
      const correctedText = await correctOcrText(originalText, apiKey);
      
      if (correctedText !== originalText) {
        article.text = correctedText;
        updatedCount++;
        console.log(`Updated text for ${article.id}`);
        
        // Save progress after each success
        const newContent = `export const db = ${formatJS(db)};\n`;
        fs.writeFileSync(databasePath, newContent);
      } else {
        console.log(`No changes needed for ${article.id}`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`Failed to reprocess ${article.id}:`, err.message);
      if (err.message.includes('quota') || err.message.includes('rate_limit')) {
        break;
      }
    }
  }

  console.log(`\nFinished. Updated ${updatedCount} articles.`);
}

reprocess().catch(console.error);
