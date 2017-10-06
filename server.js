"use strict";

// tested with node 4.4.3
// this file is not transpiled using babel
const express = require('express');
const compression = require('compression');

const appBaseUrl = '/tom-allen';

const app = express();
app.use(compression());

const addPingPage = () => {
    const createPingPage = require('@monsantoit/ping-page');
    const pingPage = createPingPage(require('./package.json'));
    app.get('/ping', pingPage); // for cf-deploy smoke test
    app.get(`${appBaseUrl}/ping`, pingPage); // for accessing through ocelot
};

addPingPage();

const serviceBindingsRouter = require('@monsantoit/velocity-service-bindings')();
app.use(`${appBaseUrl}/service-bindings`, serviceBindingsRouter);

if ( process.env.NODE_ENV !== 'production' ) {
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpack = require('webpack');
    const middlewareOptions = {
        stats: { colors: true },
        noInfo: true,  // Comment this out for more verbose webpack information
        publicPath: `${appBaseUrl}/scripts/`
    };
    app.use(webpackDevMiddleware(webpack(require('./webpack.dev.config')), middlewareOptions));

    const lessMiddleware = require('less-middleware');
    app.use(`${appBaseUrl}/styles`, lessMiddleware('./public/styles'));
}

app.use(`${appBaseUrl}/styles`, express.static('./public/styles'));
app.use(`${appBaseUrl}/scripts`, express.static('./public/scripts'));

app.get('/*', (req, res) => {
    res.send(generateHtml(appBaseUrl));
});

const generateHtml = (baseUrl) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>tom-allen</title>
    <link rel="stylesheet" href="//static-assets.velocity.ag/styles/1.0.1/velocity.css">
    <link rel="stylesheet" href="${baseUrl}/styles/style.css">
    </head>
            <body>
                <div class="nav"></div>
                <div class="contents"></div>
                <script type="text/javascript" src="${baseUrl}/service-bindings"></script>
                <script type="text/javascript" src="${baseUrl}/scripts/bundle.js"></script>
            </body>
    </html>
    `
};

app.use('/*', (err, req, res, next) => {
    console.error(err); // handle uncaught errors
    next();
});

const port = parseInt(process.env.PORT || 3000, 10);
const hostname = process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1' // unlike default, only reachable from this machine

const server = app.listen(port, hostname, () => {
    const address = server.address();
    const url = `http://${address.host || 'localhost'}:${port}`;
    console.info(`Listening at ${url}${appBaseUrl}/`);
});