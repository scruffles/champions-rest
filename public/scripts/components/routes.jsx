import React from 'react';
import {BrowserRouter, Route} from 'react-router-dom';
import Hello from './Hello';

const routes = (
    <BrowserRouter>
        <Route exact path="/tom-allen" component={Hello}/>
    </BrowserRouter>
);

export default routes;