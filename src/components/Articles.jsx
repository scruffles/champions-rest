import React from 'react';
import {db} from '../../data/database'
import moment from 'moment'
import {useMatch, useNavigate} from 'react-router-dom'
import {marked} from 'marked'

const dedent = (str) => {
    const lines = str.split('\n')
    const nonEmptyLines = lines.slice(lines.findIndex(line => line.trim() !== ''));

    // Calculate the minimum indent level
    const indentLevel = nonEmptyLines.reduce((minIndent, line) => {
        const leadingWhitespace = line.match(/^[ \t]*/)[0].length;
        return !line.trim() ? minIndent : Math.min(minIndent, leadingWhitespace);
    }, Infinity);

    // Remove the determined indent from each line
    const dedentedLines = nonEmptyLines.map(line => line.substring(indentLevel));

    // Join the lines back to a single string
    return dedentedLines.join('\n');
}

const ArticleSummary = ({article, date, yearTitle, onClick, isSelected}) =>
    <li key={article.id} className={`article-${article.id}`}>
        {yearTitle}
        <div onClick={onClick} className={isSelected ? 'selected' : 'selectable'}>
            <div className='article-title'>{article.title}</div>
            <div>
                <span className='article-publication'>{article.publication}</span>
                {' - '}
                <span className='article-date'>{date.format('MMMM Do YYYY')}</span>
            </div>
            <div>{article.summary}</div>
        </div>
    </li>

const zoomStepSize = 80 // percent to zoom for each button press

function ZoomableImage({image}) {
    const [width, setWidth] = React.useState(100)
    // const [fullScreen, setFullScreen] = React.useState(false)

    return (<div style={{position: 'relative'}}>
        <div className={'zoom-controls'}>
            <div><a href={'#'} onClick={(e) => {
                e.preventDefault()
                setWidth(width + zoomStepSize)
            }}><i className="fa-solid fa-magnifying-glass-plus"></i></a></div>
            <div>
                <a href={'#'} onClick={(e) => {
                    e.preventDefault()
                    if (width > 100) {
                        setWidth(Math.max(width - zoomStepSize, 100))
                    }
                }}>
                    <i className="fa-solid fa-magnifying-glass-minus"
                       style={{opacity: width <= 100 ? 0.5 : 1}}/>
                </a>
            </div>
{/*
            <div>
                <a href={'#'} onClick={(e) => {
                    e.preventDefault()
                    setFullScreen(!fullScreen)
                }}>
                    <i className={`fa-solid ${fullScreen ? 'fa-compress' : 'fa-expand'}`}/>
                </a>
            </div>
*/}
        </div>
        <div className='scrollable-preview'>
            <img src={`${image}`} style={{width: `${width}%`}}/>
        </div>
    </div>)
}

const PreviewPanel = ({article, selection}) => {
    const navigate = useNavigate()
    let markdown = article?.text ? marked.parse(dedent(article.text)) : 'no text available';

    return (
        <div className='preview-panel'>
            <div className='preview-selection'>
                {article?.text &&
                    <a href='#' className={selection === 'text' ? 'selected' : ''}
                       onClick={(e) => {
                           e.preventDefault()
                           navigate(`/articles/${article.id}/text`)
                       }}>text</a>
                }
                <a href='#' className={selection === 'scan' ? 'selected' : ''}
                   onClick={(e) => {
                       e.preventDefault()
                       navigate(`/articles/${article.id}/scan`)
                   }}>scan</a>
                <a href='#' className={selection === 'page' ? 'selected' : ''}
                   onClick={(e) => {
                       e.preventDefault()
                       navigate(`/articles/${article.id}/page`)
                   }}>full page</a>
            </div>
            <div>
                {
                    article ?
                        selection === 'scan' ?
                            <div className='scrollable-preview'>
                                <img src={`/${article.localCopyEdited}`} className='preview-image'/>
                            </div> :
                            selection === 'page' ?
                                <ZoomableImage image={`/${article.localCopyFull}`} /> :
                        selection === 'text' ?
                            <div className={'article-text'} dangerouslySetInnerHTML={{__html: markdown}}></div>
                                    : null : null
                }
            </div>
        </div>
    )
}

const Articles = () => {
    const navigate = useNavigate()
    const match = useMatch('/articles/:id/:selection?')
    React.useEffect(() => {
        if (match?.params?.id) {
            document.querySelector(`.article-${match?.params?.id}`)
                .scrollIntoView({behavior: "instant", block: "center", inline: "center"})
        }
    }, [match?.params?.id])

    const setSelectedArticle = (selectedArticle) => {
        navigate(`/articles/${selectedArticle.id}`)
    }

    let currentYear = null

    const getYearTitleIfChange = (year) => {
        const prevYear = currentYear
        currentYear = year
        return prevYear !== year ? <div className='year-divider'>{year}</div> : null
    }

    let selectedArticle = db.find((article) => article.id === match?.params?.id);
    return (
        <div className='article-page'>
            <div className='container'>
                <div className='scrollable'>
                    <div className='article-list'>
                        <ul>
                            {
                                db.map((article) => {
                                    const isSelected = article.id === match?.params?.id
                                    const date = moment(article.sourceDate, 'YYYY-MM-DD')
                                    return <ArticleSummary key={article.id} article={article} date={date}
                                                           yearTitle={getYearTitleIfChange(date.get('year'))}
                                                           onClick={() => setSelectedArticle(article)}
                                                           isSelected={isSelected}/>
                                })
                            }
                        </ul>
                    </div>
                    <PreviewPanel
                        article={selectedArticle}
                        selection={match?.params?.selection || (selectedArticle?.text ? 'text' : 'scan')}/>
                </div>
            </div>
        </div>
    )
}

export default Articles

// "publication": "St. Louis Post-Dispatch",
// "sourceDate": "1936-06-21",
// "title": "Tom Allen called out as the only champion to ever loose and regain his championship",
// "localCopyEdited": "public/images/articles/image-251.jpg",
// "localCopyFull": "public/images/articles/image-251b.jpg",
// "id": "251"
