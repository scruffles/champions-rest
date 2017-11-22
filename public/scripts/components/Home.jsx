import React from 'react';
import {Route} from 'react-router-dom';

class Home extends React.Component {

    render() {
        return (
            <div className='container'>
                Decorative home page goes here
            </div>
        )
    }
}

export default () => <Route path="/" exact={true} component={Home} />
