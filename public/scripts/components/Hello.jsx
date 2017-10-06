import React from 'react';
import {getAppUserProfile} from '@monsantoit/profile-client';

class Hello extends React.Component {
    constructor(props) {
        super(props);
        this.state = {fullName: ''};
    }
    componentDidMount() {
        getAppUserProfile('my-app')
        .then(({fullName}) =>
            this.setState({fullName})
        )
        .catch((error) => console.error(error));
    }
    render() {
        const {fullName} = this.state;
        return (
            <div className='greeting'>
                <h1>
                    {fullName && `Hello, ${fullName}`}
                </h1>
            </div>
        );
    }
}

export default Hello;