import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Articles from './Articles';
import Biography from './Biography';
import Record from './Record';
import About from './About';

const routes = () =>  (
    <div className='container content no-pad'>
        <BrowserRouter>
            <Navbar/>
            <Routes>
                <Route path="/" Component={Home} />
                <Route path="/biography" Component={Biography}/>
                <Route path="/record" Component={Record}/>
                <Route path="/articles/:id" Component={Articles}/>
                <Route path="/articles" Component={Articles}/>
                <Route path="/about" Component={About}/>
            </Routes>
        </BrowserRouter>
    </div>
);

export default routes;