import React from 'react';
import {Route} from 'react-router-dom';
import {fights} from '../../data/fights'
import moment from 'moment'

const reformatDate = (string) => {
    const asDate = moment(string, "YYYY-MM-DD")
    return asDate.isValid() ? asDate.format('MMM D, YYYY') : string
}

class Record extends React.Component {

    render() {
        return (
            <div className='container record drop-cap'>
                <p>Below is Tom Allen's fight record as pieced together from dozens of source.  Please note: because boxing wasn't widely covered (especially at an international level) early reporters relied on the fighters to honestly recall their past fights.  The information below is annotated to reference the original sources.  Please review and make your own judgements.</p>
                <table>
                    <tbody>
                    {
                        fights.map((fight) =>
                            <tr className={`outer ${fight.plannedOnly ? 'planned-only' : ''} ${fight.questionable ? 'questionable' : ''}`} key={`${fight.date} ${fight.opponent}`}>
                                <td className='date'>{reformatDate(fight.date)}</td>
                                <td className='result'>{fight.result}</td>
                                <td className='opponent'>{fight.opponent}</td>
                                <td className='details'>
                                    <table>
                                        <tbody>
                                            {fight.plannedOnly ? <tr><td colSpan={2} className='planned-only'>No Fight - Planned Only</td></tr> : null}
                                            {fight.questionable ? <tr><td colSpan={2} className='questionable'>Questionable Sources</td></tr> : null}
                                            <tr><td>Stakes</td><td>{fight.stakes}</td></tr>
                                            <tr><td>Rounds</td><td>{fight.rounds}</td></tr>
                                            <tr><td>Fight Time</td><td>{fight.time}</td></tr>
                                            <tr><td>Location</td><td>{fight.location}</td></tr>
                                            <tr>
                                                <td>Notes</td>
                                                <td><ul>{fight.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></td>
                                            </tr>
                                            <tr><td>Sources</td><td>{fight.articles.map((reference, idx) =>
                                                <a key={reference} href={`/articles/${reference}`}>[{idx + 1}]</a>
                                            )}</td></tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        )
                    }
                    </tbody>
                </table>
            </div>
        )
    }
}

export default Record
