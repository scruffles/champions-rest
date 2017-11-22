import React from 'react';
import {Route} from 'react-router-dom';

class About extends React.Component {

    render() {
        return (
            <div className='container'>
                About this site
            </div>
        )
    }
}

export default () => <Route path="/about" exact={true} component={About} />
