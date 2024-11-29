import React from 'react';
import {BrowserRouter} from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Articles from './Articles';
import Biography from './Biography';
import Record from './Record';
import About from './About';

const routes = (
    <div className='container content no-pad'>
        <BrowserRouter>
            <div>
                <Navbar/>
                <Home/>
                <Biography/>
                <Record/>
                <Articles/>
                <About/>
            </div>
        </BrowserRouter>
    </div>
);

export default routes;