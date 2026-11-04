// Uploads article images, transcripts and thumbnails to S3.
// Usage: npm run upload-images [-- --dryrun]
// Set STAGING_DIR to upload articles from somewhere other than the default staging folder.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const BUCKET = "s3://champions-rest.com";
const stagingDir = process.env.STAGING_DIR || path.join(os.homedir(), "projects", "claude-ancestry", "staging", "images", "articles");
const thumbsDir = path.join(root, "public", "images", "thumbs");
const dryRun = process.argv.includes("--dryrun");

const fail = (lines) => {
  console.error("\n" + lines.join("\n") + "\n");
  process.exit(1);
};

const run = (cmd, args) => spawnSync(cmd, args, { stdio: "inherit" }).status === 0;

// 1. AWS CLI installed?
if (spawnSync("aws", ["--version"], { stdio: "ignore" }).error) {
  fail([
    "The AWS CLI isn't installed.",
    "",
    "Install it with:",
    "  brew install awscli",
    "",
    "Then sign in with:",
    "  aws configure",
  ]);
}

// 2. Signed in? (get-caller-identity works for any valid key, whatever its permissions)
const who = spawnSync("aws", ["sts", "get-caller-identity", "--output", "text", "--query", "Arn"], { encoding: "utf8" });
if (who.status !== 0) {
  fail([
    "You don't appear to be signed in to AWS.",
    (who.stderr || "").trim(),
    "",
    "Sign in with the upload-only access key (see README, 'Uploading Static Files to S3'):",
    "  aws configure",
    "",
    "Enter the access key ID and secret when prompted; leave the region and output format blank.",
    "If the key was lost or disabled, create a new one in the AWS console:",
    "  IAM › Users › champions-rest-deploy › Security credentials › Create access key",
  ]);
}
console.log(`Signed in to AWS as ${who.stdout.trim()}`);

// 3. Build any missing thumbnails.
console.log("\nBuilding missing thumbnails…");
if (!run("node", [path.join(__dirname, "build-thumbnails.cjs")])) fail(["Thumbnail build failed."]);

// 4. Sync.
const sync = (from, to, label) => {
  if (!fs.existsSync(from)) {
    console.warn(`\nSkipping ${label}: ${from} doesn't exist.`);
    return true;
  }
  console.log(`\nSyncing ${label}${dryRun ? " (dry run)" : ""}:\n  ${from} → ${to}`);
  return run("aws", ["s3", "sync", from + path.sep, to, ...(dryRun ? ["--dryrun"] : [])]);
};

const ok = sync(stagingDir, `${BUCKET}/images/articles/`, "article images and transcripts") && sync(thumbsDir, `${BUCKET}/images/thumbs/`, "thumbnails");

if (!ok) fail(["An upload failed. Check the error above, then run this again; files already uploaded are skipped."]);
console.log(dryRun ? "\nDry run finished. Nothing was uploaded." : "\nUpload finished.");
