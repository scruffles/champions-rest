import React from 'react'
import {Route} from 'react-router-dom'
import facts from './../../../data/facts'
import fights from './../../../data/fights'
import articles from './../../../data/database'
import moment from 'moment'

const createRef = (parent, refType) => (props) => {
        return (
            <span className='reference' onClick={() => parent.setActiveFootnote(props.id, refType)}>
                {props.children}
                <span className='superscript'>ref</span>
            </span>
        )
    }

class FootNote extends React.Component {

    render() {
        return (
            <span className='foot-note'>
                <a href={''} className='close' onClick={(e) => {e.preventDefault(); this.props.onClose()}}>X</a>
                References for <span className='fact'>{this.props.type === 'fact' ? this.props.fact : `the fight against ${this.props.opponent} on ${this.props.date}`}</span>:
                <ul>
                {
                    this.props.articles.map((id) => {
                        const article = articles.find((a) => a.id === id)
                        const date = moment(article.sourceDate, 'YYYY-MM-DD')
                        return (
                            <li key={article.id}>
                                <a href={`/articles/${article.id}`}>{article.title}</a>
                                <span className='article-publication'>{article.publication}</span>
                                {' - '}
                                <span className='article-date'>{date.format('MMMM Do YYYY')}</span>
                            </li>)
                    })
                }
                </ul>
            </span>
        )
    }
}

class CaptionedImage extends React.Component {

    render() {
        const source = this.props.article ? articles.find(a => a.id === this.props.article) : null
        const alignment = this.props.align === 'right' ? 'pull-right' : this.props.align === 'left' ? 'pull-left' : 'inline'
        return (
            <div className={`captioned-image ${alignment}`}>
                <img src={this.props.src}/>
                <div className='caption'>
                    {this.props.children}
                    {this.props.article ? (
                        <div>
                            <a href={`/articles/${source.id}`}>
                                <span className='source'>{source.publication}</span>
                                {' • '}
                                <span className='source'>{moment(source.sourceDate, 'YYYY-MM-DD').format('MMM Do YYYY')}</span>
                            </a>
                            {/*<div className='source'>{source.title}</div>*/}
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }
}

class Quote extends React.Component {
    render() {
        const article = articles.find(a => a.id === this.props.article)
        return (
            <span className='quote'>
                "{this.props.children}"
                <span className='attribution'>
                    <span className='speaker'> - {this.props.speaker}</span>
                    <span className='quote-source'>
                        (<a href={`/articles/${article.id}/`}><span className='source'>{article.publication}</span>{' • '}<span className='source'>{moment(article.sourceDate, 'YYYY-MM-DD').format('MMM Do YYYY')}</span></a>)
                    </span>
                </span>
            </span>
        )
    }
}

class Biography extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedFootNote: null,
            selectedFootNoteType: null
        }
        this.Reference = createRef(this, 'fact')
        this.Fight = createRef(this, 'fight')
        this.setActiveFootnote = this.setActiveFootnote.bind(this)
    }

    setActiveFootnote(id, refType) {
        this.setState({
            selectedFootNote: id,
            selectedFootNoteType: refType,
        })
    }

    render() {
        const Ref = this.Reference
        const Fight = this.Fight
        const selectedReference =
            this.state.selectedFootNote && this.state.selectedFootNoteType === 'fact' ?
                facts.find((f) => f.id === this.state.selectedFootNote)
            : this.state.selectedFootNote && this.state.selectedFootNoteType === 'fight' ?
                fights.find((f) => f.id === this.state.selectedFootNote)
            : null

        return (
            <div className='container biography'>

                <CaptionedImage src='/images/pictures/tom-allen.jpg' align='right'>
                    Tom Allen in fighting shape circa early 1870s
                </CaptionedImage>

                <p className='drop-cap'>
                    Tom Allen was one of the pioneers of the sport of boxing and one of the last champions of the bare-knuckle era. The sport of prize fighting was generally unregulated and completely illegal in most areas. While there were referees and formalized rules, there was no governing body tracking titles.

                    {/*Larger, more publicized fights were attended by crowds ferried off in steamboats or*/}
                    {/*trains to undisclosed locations to keep law enforcement off guard. Smaller fights were arranged and*/}
                    {/*fought within a matter of hours. */}
                </p>
                <p>
                    Newspaper reporting was inconsistent, sometimes relying on the word of fighters or other interested
                    parties (gamblers & spectators) for background on the fights and fighters. In many cases, newspaper
                    reports made 10 years after a fight may completely contradict results made by numerous articles
                    written the day of the fight. The details below draw on hundreds of sources to summarize the life of
                    Tom Allen as accurately as possible. Sources are referenced every step of the way so readers can
                    dive down into the newspapers of the day and read the details first hand.
                </p>

                <h2>Early Life</h2>
                <p className='drop-cap'>
                    Tom Allen was born in <Ref id='001'>Birmingham England on April 23, 1839.</Ref> Not much is known
                    about his early life and family. <Ref id='002'>He learned the trade of gun making as a youth</Ref>,
                    and went into the <Ref id='003'>English Army to fight in the Crimean War.</Ref> <Ref id='004'>It was
                    in the Army that he became interested in prize fighting.</Ref> <Ref id='005'>He started fighting around the
                    age of 20.</Ref>  Prize fights were still fought using the London Prize Ring Rules at the time, which involved
                    bare knuckles.  It wouldn't be until the end of Allen's career that Queensbury Rules (and gloves) would
                    be introduced.
                </p>

                <h2>Early Fights in England</h2>
                <p>
                    Allen fought a number of prize fighters early in his career.  Little is known about the early fights other than Allen's own accounts.

                    Allen fought a number of battles in England before <Fight id='001'>fighting the English Champion Joe
                    Goss to a draw in March of 1867.</Fight>
                </p>

                <h2>Fights in America</h2>
                <CaptionedImage src='/images/pictures/image-180a.jpg' align='left' article='180'/>

                <p>
                    <Ref id='006'>In July of 1867, Allen immigrated to the United States</Ref> where he settled in Cleveland Ohio.  His first fight was against <Fight id='002'>Bill Davis in January 1869</Fight>.  They fought on Chouteau Island near St Louis for $1,000/side.  After winning the fight, Allen declared himself Champion of America (despite Davis not having the title to pass along).  This bold declaration got attention from other fighters.
                </p>
                <p>
                    In February, Allen fought Charlie Gallagher, a Canadian now living in Cleveland.  The fight took place on Carroll Island near St Louis.  The fight only lasted 3 minutes, as Allen was knocked out in the second round with a single well placed blow.  Allen would later get his revenge by <Fight id='004'>beating Charlie Gallagher him on Foster's Island in 11 rounds</Fight>.
                </p>
                <p>
                    Allen planned a fight with Mike McCoole, but while in training was <Ref id='038'>arrested in Ohio.</Ref>  The arrest was in May, and <Ref id='008'>by June, he had moved to St Louis, to open a saloon on 5th (N Broadway) between O'Fallon and Biddle.</Ref>
                </p>
                <p>
                    In June 1869, <Fight id='003'>Allen fought Mike McCoole</Fight> for $1,000/side and the Championship of America.  The fight took place on Foster's Island, 26 miles south of St Louis. McCoole had a large number of supporters at the fight, and Allen had very few.  Before the fight, Allen tried to settle the crowd with a few words, but with little affect.  Allen was winning handily after 17 rounds, when McCoole's followers stormed the ring with knives, guns and clubs and ended the match.  The referee announced the result the following day:  McCoole had won the match.
                </p>

                <CaptionedImage src='/images/pictures/statue.jpg' align='right'>
                    Kennerville statue depecting the Allen/McCoole fight
                    {/* https://www.flickr.com/photos/8599745@N08/37869100311 */}
                </CaptionedImage>
                <p>
                    Allen would fight a few others after McCoole, but one of his most notable fights would be one he lost.  In <Fight id='005'>1870 Allen would lose to English Champion Gem Mace</Fight>.  Mace was from England and claimed the English title.  The fight was billed as the first World Heavyweight Championship fight despite McCoole having a claim on the American title.  The fight took place in Kennerville Louisiana for $2,500.  The fight lasted 44 minutes and ended when Allen was thrown to the ground with Mace on top of him.  It was thought at the time that Allen had broken his neck, but in time he recovered.  Today a statue of the pair marks the site of the battle.
                </p>

                <p>
                    <Fight id='007'>In November 1870, Allen fought Gem Gallagher</Fight>.  Gem Gallagher is not related to Charles Gallagher, but coincidentally, the two met for the first time when Charles seconded Gem for this fight.  The fight was broken up by police, but resumed in Kansas City.  Allen won in 15 rounds and 44 minutes.
                </p>

                <p>
                    By 1873 Mace was no longer fighting.  With the title up for grabs, the two top contenders, <Fight id='008'>Allen and Mike McCool decide to fight for the championship.</Fight>  On September 23rd 1873 the two met on Chouteau Island.  The fight lasted 19 minutes, and Allen walked away as the Champion.
                </p>

                <p>
                    <Fight id='009'>Allen's last fight in America would be against Joe Goss</Fight>, an Englishman claiming the championship title for his country.  The two met in Kentucky and fought for $2500/side, which was said to be the largest prize for a fight at the time.  The fight was setup in Kenton County but before it could start, the local militia forced the fighters to relocate to nearby Boone County.  While Allen seemed to have a huge advantage over Goss, Goss' supporters were vocal and violent.  In the 21st round, Allen knocked Goss to the ground and returned to his corner.  The crowd got especially threatening at the sight of Goss losing.  It was at this point that Allen walked across the ring and hit Goss as he was clearly trying to get up.  The fight was over on a foul, but Allen was going to be spared by the mob.
                </p>

                <Quote article='167' speaker='Tom Allen'>
                    The dirtiest deal I ever got, and I have had some pretty hard ones, was in my fight with Joe Goss.
                </Quote>

                <p>
                    Both fighters were arrested.  <Ref id='015'>Allen posted bail and promptly fled to Canada and eventually England.</Ref>
                </p>

                <CaptionedImage src='/images/pictures/image-203a.jpg' align='left' article='203'/>

                <h2>Back In England</h2>

                <p>
                    <Ref id='031'>After losing to Goss, Allen said he would never fight again.  He said there was too much corruption involved in fights.</Ref>  However he fought three more times while in England against <Fight id='10'>Tompkins Gilbert</Fight>, <Fight id='11'>Charley Davis</Fight> and <Fight id='12'>Jim Stewart</Fight>.  The Davis fight was said to be <Ref id='037'>the first fought in England under the Queensbury rules.</Ref>.  It also earned Allen the Championship of England.
                </p>


                <h2>Return to St Louis</h2>

                <p>
                    Having waited out the statute of limitations on his crimes in Kentucky, <Ref id=''>Allen returned to St Louis in 1882.</Ref>  He imediatly tried setting up a fight with the current champion John Sullivan, but the fight never came together:
                </p>

                <Quote article='099' speaker='Tom Allen'>
                    I have not been out of the house since the exhibition.  I have been sick.  I am going to Chicago to see a glove contest between Sullivan and Elliott, and if I mend a bit I will have a go with the winner.  There is another good fight left in me yet.
                </Quote>

                <p>
                    He never got that last fight in.  Instead he opened up a new saloon on Market street, which he would run for the remainder of his life.
                </p>

                <p>
                    After his fighting career, Allen found himself <Ref id='033'>seconding other boxers, training them and promoting fights</Ref>.  <Ref id='036'>He was once arrested for managing a fight in Florissant Missouri.</Ref> He was known to <Ref id='030'>referee wrestling matches</Ref> and even at one point <Ref id='035'>a sword fight</Ref>.  One of the more colorful contributions he made to the ring was <Ref id='034'>providing Ox-tail jelly to fighters to rub on their stomach</Ref> allowing them to take a few more punches.
                </p>

                <CaptionedImage src='/images/pictures/image-203b.jpg' align='right' article='203'>
                    A photo taken of the interior of Allen's Market Street Saloon: "Champion's Rest"
                </CaptionedImage>

                <h2>Champion's Rest</h2>

                <p>
                    Throughout Allen's life in America he ran what he would call a Concert Saloon.  <Ref id='007'>He ran one in Cleveland</Ref> during his brief stay there.  When he moved to St Louis in 1869, he <Ref id='008'>opened one on 5th Street (now North Broadway) between O'Fallon and Biddle</Ref>.  <Ref id='009'>In 1871 he moved to 417 Washington Ave,</Ref> <Ref id='017'>where he stayed</Ref> until his lease ended in 1876.  <Ref id='010'>He moved into a new building at 611 Fifth St until his legal troubles in Kentucky drove him back to England.</Ref>  <Ref id='011'>Six years later he returned and opened a saloon on Market Street near 7th where he would spend his retirement.</Ref>  He named it <em>Champion's Rest</em>.
                </p>

                <p>
                    The saloon was decorated with fighting memorabilia including the <Ref id='021'>American championship belt presented to him in April 1870</Ref> and the <Ref id='018'>large sliver championship</Ref> <Ref id='022'>cup presented to him after the Davis fight.</Ref>  The front of the saloon was a tap room with small open stalls for drinking.  Behind that was the concert room; a large open room with a piano, open seating and a fighting ring.  The floor was covered in sawdust.
                </p>

                <CaptionedImage src='/images/pictures/image-202a.jpg' align='left' article='202'>
                    Allen at his station each night ruling over the saloon with his scull cap and gavel
                </CaptionedImage>

                <p>
                    Allen's 'free and easy' saloons had no entry fees or minimum purchases. <Ref id='027'>There were no restrictions on sleeping in the establishment, and it was open all night.  As a result, Allen's saloons attracted a lot of homeless, especially in the winter.</Ref>  Theft and violence (other than organized fights) were not permitted.  Arguments were resolved in a boxing ring.  Those causing trouble were banned.  The saloon's tolerance for vagrants gave it a reputation.  <Ref id='020'>A book of fiction written in 1892 even describes a scene of poverty within the walls of Allen's saloon.</Ref>
                </p>

                <Quote article='209' speaker='Passing of the Champions Rest'>
                    It has never been considered a dangerous place for anyone to enter and Allen always thought himself in honor bound to protect his guests from possible trouble.  Thieves he could not tolerate and drove them from his establishment as soon as their identity was made known.
                </Quote>

                <p>
                    <Ref id='019'>Allen often personally conducted the affairs of his saloon, hosting concerts from the piano and calling for attention before songs with a gavel.</Ref>  Shows included piano and singing (by the champ and others).  There was a ritual each nights events that provided structure.  A common part of that ritual was the song <Ref id='026'>'Annie Laurie', which was said to be Allen's favorite song.</Ref>
                </p>

                <p>
                    Allen's saloons still had their share of disruptions.  More than one <Ref id='032'>led Allen to the courtroom,</Ref> including once in 1899, when <Ref id='028'>Allen killed a patron (Timothy ConFoy) and was charged with murder.  The charges were later dismissed.</Ref>  <Ref id='025'>Allen was at other times arrested for firing his gun in the street (out of frustration that a rival saloon was getting more business)</Ref> and for a <Ref id='029'>street fight between him and Dan Daly.</Ref>
                </p>

                <CaptionedImage src='/images/pictures/image-167a.jpg' align='right' article='167'/>

                <h2>On 'Boxing'</h2>

                <p>
                    Allen's fighting career wound down just as the sport was moving from the bare knuckle days to the sport we know today - from the London Prize Ring rules to the Queensburry rules.  Allen wasn't shy about his opinions of the new direction:
                </p>

                <Quote article='167' speaker='Tom Allen'>
                    I regard it as a duty to enlighten the young and likewise remind the old about the prize ring.  There are a good many of the younger generation who do not know what a prize fighter is.  They have never seen anything but glove fighter is.  They have never seen anything but glove fighters in these days.  A prize-fighter is a fighter who battles with bare knuckles in the open air and on the turf, regardless of hail, rain, sunshine or snow.  A boxing champion, or glove-fighter, is one who has feather pillows on his hands when he enters the ring, which must be in a warm, comfortable room.  In my time we had prize fights; now there are boxing matches with top heavy purses hung up.
                </Quote>


                <Quote article='167' speaker='Tom Allen'>
                    Boxing of to-day and prize-fighting are two different trades.  A man to be a prize-fighter must learn to strike straight.  He cannot stop a blow with his arms, like a man can with boxing gloves on.  Men fighting with bare knuckles do not stand so close to each other as men that have gloves on, for the simple reason that with a boxing glove on the hand, and it open, the reach is 10 inches longer.  So that you can put up your gloves and parry a blow or clinch and save yourself until the referee comes and parts you. All the boxers I have seen stand with their feet so wide apart that they could not recover themselves if they were on the turf and they could not strike a blow at all if they had only their bare hands.
                </Quote>

                <CaptionedImage src='/images/pictures/image-255a.jpg' align='left' article='255'>
                    Allen near the turn of the century
                </CaptionedImage>

                <h2>Family</h2>

                <p>
                    Allen had <Ref id='014'>two sisters</Ref> one of which was a <Ref id='013'>school teacher in Corydon Indiana.</Ref>  He also had <Ref id='012'>two daughters, both married: One in Birmingham England (J. H. Newey), one in St Louis (Mary Taylor).</Ref>  His wife was still living in England at the time of his death.
                </p>


                <h2>Death</h2>
                <p>
                    In early 1903 Allen had a cold that had him confined to bed by January 31st.  This in itself wouldn't have been newsworthy, but it was from that bed that Allen (64) announced his engagement to his housekeeper Tilly Hartgrove (age 21).  Both Allen and Hartgrove were still married to others.  Allen was taken to <Ref id='042'>Baptist Hospital at Garrison and Franklin</Ref> as his cold <Ref id='043'>turned to pneumonia.</Ref>  <Ref id='044'>Allen's daughter (and only local family) was refused access to him</Ref>.  Allen had his will changed to give Hartgrove <Ref id='045'>power of attorney</Ref> and the <Ref id='046'>inheritance of nearly all Allen's possessions.</Ref>
                </p>

                <p>
                    <Ref id='042'>Tom Allen died at Baptist Hospital on April 5th, 1903.</Ref> With his estate in legal shambles, there was no money for a grave.  <Ref id=''>Local boxing celebrities had a benefit to raise money to pay for the headstone over Allen's grave.</Ref>
                </p>

                <p>
                    <Ref id='048'>Control of Allen's saloon was kept (at gunpoint when necessary) by the saloon keeper John Murphy, who managed the saloon for Allen's daughter.  Another party (W. A. Byrnes) claimed to have bought the building from Allen and Hartgrove on his deathbed, and claimed the upstairs living quarters.</Ref>  This situation remained while the courts sorted everything out.  <Ref id='049'>In the end there was very little left of the estate to pass to Allen's widow back in England.</Ref>  <Ref id='050'>The championship cup was found by Mary's husband Edward in a pawn shop in 1938.</Ref>
                </p>

                <h2>Allen's Place in History</h2>

                <p>induction into hall of fame</p>

                <div className='misc-photos'>

                    <CaptionedImage src='/images/pictures/image-117a.jpg' align='inline' article='117'>
                        Allen 10 years post-retirement
                    </CaptionedImage>

                    <CaptionedImage src='/images/pictures/image-117b.jpg' align='inline' article='117'/>

                    <CaptionedImage src='/images/pictures/image-171a.jpg' align='inline' article='171'/>
                    <CaptionedImage src='/images/pictures/image-203c.jpg' align='inline' article='203'/>
                    <CaptionedImage src='/images/pictures/image-209a.jpg' align='inline' article='209'/>
                    <CaptionedImage src='/images/pictures/image-220b.jpg' align='inline' article='220'/>
                    <CaptionedImage src='/images/pictures/image-242b.jpg' align='inline' article='242'/>
                    <CaptionedImage src='/images/pictures/image-247a.jpg' align='inline' article='247'/>
                    <CaptionedImage src='/images/pictures/image-255b.jpg' align='inline' article='255'/>
                    <CaptionedImage src='/images/pictures/tom-allen2.jpg' align='inline'/>

                </div>


                { this.state.selectedFootNote !== null ?
                    <FootNote {...selectedReference} type={this.state.selectedFootNoteType} onClose={() => this.setState({selectedFootNote: null})}/>
                    : null
                }
            </div>
        )
    }
}

export default () => <Route path="/biography" exact={true} component={Biography} />
