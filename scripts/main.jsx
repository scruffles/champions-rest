import es6Promise from 'es6-promise';
import React from 'react';
import ReactDOM from 'react-dom';
import routes from './components/routes';

es6Promise.polyfill();

ReactDOM.render(routes, document.querySelector('.contents'));
