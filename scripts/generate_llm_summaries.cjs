const fs = require('fs');
const path = require('path');

const databasePath = path.resolve('data/database.js');

function formatJS(obj) {
  const json = JSON.stringify(obj, null, 2);
  // Unquote keys to match project style
  return json.replace(/^(\s+)"(\w+)":/gm, '$1$2:');
}

async function generateSummaries() {
  console.log('Reading database...');
  const content = fs.readFileSync(databasePath, 'utf8');

  // Load the DB
  const tmpFile = path.resolve('data/tmp_db_summaries.cjs');
  // Convert export const db = [...] to module.exports = [...] for CJS loading
  const cjsContent = content.replace('export const db =', 'module.exports.db =');
  fs.writeFileSync(tmpFile, cjsContent);
  const { db } = require(tmpFile);
  fs.unlinkSync(tmpFile);

  // Process all articles that have either text or an existing summary
  // We check for word count to see if it needs re-summarizing (basic heuristic: < 20 or > 30 words)
  const needsResummary = (s) => {
    if (!s) return true;
    const wordCount = s.split(/\s+/).filter(w => w.length > 0).length;
    return wordCount < 20 || wordCount > 30;
  };

  const articlesToSummarize = db.filter(a => {
    const hasSource = (a.text && a.text.trim() !== '') || (a.summary && a.summary.trim() !== '');
    return hasSource && needsResummary(a.summary);
  });
  console.log(`Found ${articlesToSummarize.length} articles to summarize.`);

  if (articlesToSummarize.length === 0) {
    console.log('No articles to summarize.');
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.log('Please set it using: export OPENAI_API_KEY=your_key_here');
    console.log('\nExample of what a "thoughtful summary" looks like (generated for Article 156):');
    console.log('\"The Governor of Florida expresses strong opposition to the proposed Corbett-Mitchell fight, while Cripple Creek offers a substantial $25,000 purse to host the contest, promising a thrilling match if it proceeds despite political resistance.\"');
    return;
  }

  let updatedCount = 0;
  for (const article of articlesToSummarize) {
    console.log(`Generating summary for Article ${article.id}: ${article.title}...`);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: 'You are a historian specializing in 19th-century sports. Provide a thoughtful, engaging summary of the news article. Your summary MUST be between 20 and 30 words. Focus on key figures (like Tom Allen, Mike McCoole, Jem Mace), the specific event, and the historical context. Do not use generic phrases like "This article discusses..."' 
            },
            { 
              role: 'user', 
              content: `Title: ${article.title}\n\nExisting Summary: ${article.summary || 'None'}\n\nArticle Text: ${(article.text || '').substring(0, 4000)}` 
            }
          ],
          max_tokens: 150
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      const summary = data.choices[0].message.content.trim();
      article.summary = summary;
      updatedCount++;

      // Save progress
      const newContent = `export const db = ${formatJS(db)};\n`;
      fs.writeFileSync(databasePath, newContent);
      console.log(`Saved summary for ${article.id}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      console.error(`Failed to generate summary for ${article.id}:`, err.message);
      break; // Stop on API error (e.g., rate limit or invalid key)
    }
  }

  console.log(`\nFinished. Updated ${updatedCount} articles.`);
}

generateSummaries().catch(console.error);
