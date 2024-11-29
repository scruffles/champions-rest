import React from 'react';
import {Route} from 'react-router-dom';

class Home extends React.Component {

    render() {
        return (
            <div className='container home'>
                <img src='/images/pictures/fighting-stance.jpg'/>
                <p className='drop-cap'>
                    Champion's Rest chronicles the life of heavyweight boxer Tom Allen, who held the championship title twice in the 1870's.  Allen immigrated to the United States from England in the 1860s eventually settling down in St Louis Missouri.  He fought bare knuckle and retired shortly after the introduction of the Queensbury Rules.  He continued training fighters while running his saloon in St Louis until his death in 1903.  In 2014 he was inducted into the <a href="http://www.ibhof.com/pages/about/inductees/pioneer/allen.html">Boxing Hall of Fame</a>.
                </p>
            </div>
        )
    }
}

export default Home
