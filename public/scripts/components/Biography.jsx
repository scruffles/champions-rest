import React from 'react';
import {Route} from 'react-router-dom';

class Biography extends React.Component {

    render() {
        return (
            <div className='container'>
                Biography
            </div>
        )
    }
}

export default () => <Route path="/biography" exact={true} component={Biography} />
