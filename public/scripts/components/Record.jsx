import React from 'react';
import {Route} from 'react-router-dom';

class Record extends React.Component {

    render() {
        return (
            <div className='container'>
                Annotated Fight Record
            </div>
        )
    }
}

export default () => <Route path="/record" exact={true} component={Record} />
