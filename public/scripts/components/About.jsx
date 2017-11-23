import React from 'react';
import {Route} from 'react-router-dom';

class About extends React.Component {

    render() {
        return (
            <div className='container'>
                Champions-rest.com was created by Bryan Young; the great-great-great-grandson of Tom Allen.  Originally this project started as a genealogy research project.  It wielded a huge amount of information that didn't seem to be available anywhere else on the internet. Common genealogy apps didn't seem to be appropriate for presenting this kind of information.
            </div>
        )
    }
}

export default () => <Route path="/about" exact={true} component={About} />
