# champions-rest.com

This is the source for champions-rest.com which documents the life of Tom Allen: world heavyweight champion pugilist of the 1870s.

## Running Locally

copy images from s3 and add them under /public/images

run `nvm use` to switch to the Node version in `.nvmrc` (24)

run `npm run dev`

open the browser to `http://localhost:3000/`

## Uploading Static Files to S3

One command uploads everything — article clippings, full pages, transcripts and thumbnails:

```
npm run upload-images
```

It checks that the AWS CLI is installed and that you're signed in (and tells you how to fix either), builds any missing thumbnails, then syncs:

- `~/projects/claude-ancestry/staging/images/articles/` → `s3://champions-rest.com/images/articles/` (set `STAGING_DIR` to use another folder)
- `public/images/thumbs/` → `s3://champions-rest.com/images/thumbs/`

Files already in the bucket are skipped. To see what would upload without uploading anything:

```
npm run upload-images -- --dryrun
```

### First-time setup

```
brew install awscli
aws configure
```

Use the upload-only access key for the `champions-rest-deploy` IAM user; leave the region and output format blank.

## Article Thumbnails

The article lists use small thumbnails from `/images/thumbs/` (they fall back to the full clipping if a thumbnail is missing). `npm run upload-images` builds missing ones automatically; to build them without uploading:

```
npm run build-thumbnails
```
