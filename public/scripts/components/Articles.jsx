import React from 'react';
import {Route} from 'react-router-dom';
import db from '../../../database'
import moment from 'moment'
import scrollToElement from 'scroll-to-element'

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
            <div className='preview-panel' style={{flexBasis: '50%'}}>
                <div className='preview-selection'>
                    <a href='#' onClick={(e) => this.setPreviewType(e, 'small-pic')}>edited</a>
                    <a href='#' onClick={(e) => this.setPreviewType(e, 'large-pic')}>full</a>
                    <a href='#' onClick={(e) => this.setPreviewType(e, 'text')}>text</a>
                </div>
                {
                    this.props.article ?
                    this.state.previewType === 'small-pic' ?
                        <img src={`/tom-allen/${this.props.article.localCopyEdited}`} className='preview-image'/> :
                    this.state.previewType === 'large-pic' ?
                        <img src={`/tom-allen/${this.props.article.localCopyFull}`} className='preview-image'/> :
                    this.state.previewType === 'text' ?
                        <div>no text</div>
                    : null : null
                }
            </div>
        )
    }
}

class Articles extends React.Component {

    setSelectedArticle(selectedArticle) {
        this.props.history.push({pathname: `/tom-allen/articles/${selectedArticle.id}`})
    }

    componentDidMount() {
        document.querySelector(`.article-${this.props.match.params.id}`).scrollIntoView({behavior: "instant", block: "center", inline: "center"})
    }

    render() {

        let currentYear = null

        const getYearTitleIfChange = (year) => {
            const prevYear = currentYear
            currentYear = year
            return prevYear !== year ? <div className='year-divider'>{year}</div> : null
        }

        return (
            <div className='article-page'>
                <div className='container'>
                    <h1>Articles</h1>
                    <div className='overview'>
                        {db.length} Articles
                    </div>
                    <div className='container scrollable'>
                        <div className='article-list'>
                            <ul>
                                {
                                    db.map((article) => {
                                        const isSelected = article.id === this.props.match.params.id
                                        const date = moment(article.sourceDate, 'YYYY-MM-DD')
                                        return <ArticleSummary key={article.id} article={article} date={date}
                                                               yearTitle={getYearTitleIfChange(date.get('year'))}
                                                                onClick={() => this.setSelectedArticle(article)}
                                                                isSelected={isSelected}/>
                                    })
                                }
                            </ul>
                        </div>
                        <PreviewPanel article={db.find((article) => article.id === this.props.match.params.id)} />
                    </div>
                </div>
            </div>
        )
    }
}

export default () => <Route path="/tom-allen/articles/:id" component={Articles} />

// "publication": "St. Louis Post-Dispatch",
// "sourceDate": "1936-06-21",
// "title": "Tom Allen called out as the only champion to ever loose and regain his championship",
// "localCopyEdited": "public/images/articles/image-251.jpg",
// "localCopyFull": "public/images/articles/image-251b.jpg",
// "id": "251"
