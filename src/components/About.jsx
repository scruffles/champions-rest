import React from 'react';
import {Route} from 'react-router-dom';

class About extends React.Component {

    render() {
        return (
            <div className='container about'>
                <img src='/images/pictures/champions-rest.jpg'/>

                <h2>Why?</h2>
                <p>Champions-rest.com was created by Bryan Young; a great-great-great-grandson of Tom Allen.  Originally this project started as a genealogy research project.  It wielded a huge amount of information that didn't seem to be available anywhere else on the internet. Common genealogy apps didn't seem to be appropriate for organizing and presenting this kind of content. Digital notes and clippings evolved into this website.</p>

                <h2>The Name</h2>
                <p>Champions-rest.com is named after Tom Allen's saloon, which entertained patrons from the 1870s until after Allen's death in 1903.  </p>
            </div>
        )
    }
}

export default About
