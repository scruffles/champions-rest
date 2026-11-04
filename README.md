# champions-rest.com

This is the source for champions-rest.com which documents the life of Tom Allen: world heavyweight champion pugilist of the 1870s.

## Running Locally

copy images from s3 and add them under /public/images

run `npm run dev`

open the browser to `http://localhost:3000/`

## Uploading Static Files to S3

Install the AWS CLI if needed:

```
brew install awscli
aws configure
```

Dry run to verify paths:

```
aws s3 sync ~/projects/claude-ancestry/staging/images/articles/ s3://champions-rest.com/images/articles/ --dryrun
```

Upload:

```
aws s3 sync ~/projects/claude-ancestry/staging/images/articles/ s3://champions-rest.com/images/articles/
```

## Article Thumbnails

The article lists use small thumbnails from `/images/thumbs/` (they fall back to the full clipping if a thumbnail is missing). Rebuild them after adding articles, then upload:

```
npm run build-thumbnails
aws s3 sync public/images/thumbs/ s3://champions-rest.com/images/thumbs/
```
