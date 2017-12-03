import React from 'react'
import {NavLink} from 'react-router-dom'

export default class Biography extends React.Component {

    render() {
        return (
            <nav className="navbar navbar-expand-sm navbar-dark">
                <NavLink to="/" exact={true} className='navbar-brand nav-link'>
                    <img src='/images/logo.png'/>
                    <div className='title'>Champion's Rest</div>
                    <div className='subtitle'>The life of champion boxer Tom Allen</div>
                </NavLink>
                <ul className="navbar-nav mr-auto"/>
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <NavLink to="/biography" exact={true} className='nav-link'>Biography</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/articles" exact={false} className='nav-link'>Articles</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/record" exact={true} className='nav-link'>Record</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/about" exact={true} className='nav-link'>About</NavLink>
                    </li>
                </ul>
            </nav>
        )
    }
}