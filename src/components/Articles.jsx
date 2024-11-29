import React from 'react';
import {db} from '../../data/database'
import moment from 'moment'
import {useMatch, useNavigate} from 'react-router-dom'

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


class PreviewPanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = {previewType: 'small-pic'};
    }

    setPreviewType(e, previewType) {
        e.preventDefault()
        this.setState({previewType})
    }

    render() {
        return (
            <div className='preview-panel'>
                <div className='preview-selection'>
                    <a href='#' className={this.state.previewType === 'small-pic' ? 'selected' : ''}
                       onClick={(e) => this.setPreviewType(e, 'small-pic')}>article</a>
                    <a href='#' className={this.state.previewType === 'large-pic' ? 'selected' : ''}
                       onClick={(e) => this.setPreviewType(e, 'large-pic')}>full page</a>
                    <a href='#' className={this.state.previewType === 'text' ? 'selected' : ''}
                       onClick={(e) => this.setPreviewType(e, 'text')}>text</a>
                </div>
                <div className='scrollable-preview'>
                {
                    this.props.article ?
                    this.state.previewType === 'small-pic' ?
                        <img src={`/${this.props.article.localCopyEdited}`} className='preview-image'/> :
                    this.state.previewType === 'large-pic' ?
                        <img src={`/${this.props.article.localCopyFull}`} className='preview-image'/> :
                    this.state.previewType === 'text' ?
                        <div>no text</div>
                    : null : null
                }
                </div>
            </div>
        )
    }
}

const Articles = () => {
    const navigate = useNavigate()
    const match = useMatch('/articles/:id')
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

    return (
        <div className='article-page'>
            <div className='container'>
                <div className='scrollable'>
                    <div className='article-list'>
                        <ul>
                            {
                                db.map((article) => {
                                    const isSelected = article.id === match?.id
                                    const date = moment(article.sourceDate, 'YYYY-MM-DD')
                                    return <ArticleSummary key={article.id} article={article} date={date}
                                                           yearTitle={getYearTitleIfChange(date.get('year'))}
                                                           onClick={() => setSelectedArticle(article)}
                                                           isSelected={isSelected}/>
                                })
                            }
                        </ul>
                    </div>
                    <PreviewPanel article={db.find((article) => article.id === match?.params?.id)}/>
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
