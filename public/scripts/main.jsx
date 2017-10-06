import es6Promise from 'es6-promise';
import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import routes from './components/routes';
import packageJson from '../../package.json';
import createNavbar from '@monsantoit/velocity-navbar';

es6Promise.polyfill();
const navBar = createNavbar({React, ReactDOM, moment}, packageJson);

navBar.install({name: 'tom-allen'}, document.querySelector('.nav'))
.then(() => {
    ReactDOM.render(routes, document.querySelector('.contents'));
}).catch((e) => {
    console.error(e);
});