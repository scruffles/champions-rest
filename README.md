# champions-rest.com

This is the source for champions-rest.com which documents the life of Tom Allen: world heavyweight champion pugilist of the 1870s.



## TODO
* remove all monsanto shit
* replace font
* alias www.champions-rest.com to champtions-rest.com
* write some upload scripts
* put everything on github


Setup:

Please navigate to your project folder and run the following to start your project:

`cd tom-allen`

`npm run dev`

Then navigate to the following url to see your project in action: `http://localhost:3000/`

Use the following command to run your tests once: `npm test`

Or use the following command to run your tests continuously: `npm run test:dev`

When you are ready to push your build to cloud foundry

`npm install`

`npm run test`

`npm run package`

`rm -rf node_modules`

`npm install --production`

`cf-deploy  --oauthClientId=$SMOKE_TESTING_CLIENT_ID --oauthClientSecret=$SMOKE_TESTING_SECRET`
