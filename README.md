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
