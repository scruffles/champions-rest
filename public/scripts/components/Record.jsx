import React from 'react';
import {Route} from 'react-router-dom';
import fights from '../../../data/fights'

class Record extends React.Component {

    render() {
        return (
            <div className='container record drop-cap'>
                <p>Below is Tom Allen's fight record as pieced together from dozens of source.  Please note: because boxing wasn't widely covered (especially at an international level) early reporters relied on the fighters to honestly recall their past fights.  The information below is annotated to reference the original sources.  Please review and make your own judgements.</p>
                <table>
                    {
                        fights.map((fight) =>
                            <tr>
                                <td>{fight.date}</td>
                                <td className='result'>{fight.result}</td>
                                <td>{fight.opponent}</td>
                                <td>{fight.articles.map((reference, idx) =>
                                    <a href={`/articles/${reference}`}>[{idx + 1}]</a>
                                )}</td>
                            </tr>
                        )
                    }
                </table>
            </div>
        )
    }
}

export default () => <Route path="/record" exact={true} component={Record} />
