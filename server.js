"use strict";

// tested with node 4.4.3
// this file is not transpiled using babel
const express = require('express');
const compression = require('compression');

const app = express();
app.use(compression());

if ( process.env.NODE_ENV !== 'production' ) {
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpack = require('webpack');
    const middlewareOptions = {
        stats: { colors: true },
        noInfo: true,  // Comment this out for more verbose webpack information
        publicPath: `/`
    };
    app.use(webpackDevMiddleware(webpack(require('./webpack.dev.config')), middlewareOptions));

    const lessMiddleware = require('less-middleware');
    app.use(lessMiddleware('./public/styles', {
        dest: './public'
    }))
}

app.use(`/`, express.static('./public'));

const indexFile = require('fs').readFileSync('./public/index.html', {encoding: 'UTF-8'})
app.get('/*', (req, res) => {
    res.send(indexFile);
});

app.use('/*', (err, req, res, next) => {
    console.error(err); // handle uncaught errors
    next();
});

const port = parseInt(process.env.PORT || 3000, 10);
const hostname = process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1' // unlike default, only reachable from this machine

const server = app.listen(port, hostname, () => {
    const address = server.address();
    const url = `http://${address.host || 'localhost'}:${port}`;
    console.info(`Listening at ${url}/`);
});