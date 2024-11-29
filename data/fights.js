export const fights =
    [
        {date: '1860-04-20', opponent: 'Jack White', result: 'win', articles: ['084', '148', '203'], stakes: '5£/side', rounds: '10', details: ['first fight', 'before emigrating', '5£/side'], location: 'England'},
        {date: '1860-09-17', opponent: 'Nobby Hall', result: 'loss or draw', articles: ['084', '148'], details: ['before emigrating'], stakes: '5£/side or 25£/side', time: '40 or 42 min', rounds: '15', location: 'England'},
        {date: '1860-03-20', opponent: 'Morris Conner', result: 'win', articles: ['084', '148'], details: ['before emigrating'], rounds: '16 or 22', time: '1hr 10 min or 50 minutes', stakes: '10£/side', location: 'England'},
        {questionable: true, date: '1861', opponent: 'Waggoner', result: 'win', articles: ['007', '234'], details: ['also said to be first fight'], location: 'Birmingham England', stakes: '$25'},
        {date: '1861-06-08 or 1861-09', opponent: 'Jack Gould', result: 'win', articles: ['007', '084', '148', '234'], details: [], stakes: '15£/side', time: '50 min or 1 hr 22 min', rounds: '51 or 11', location: 'England'},
        {date: '1864-06-02 or 1862-06-28', opponent: 'Posh Price', result: 'loss', articles: ['007', '084', '148', '234'], details: [], time: '50 or 55 minutes', rounds: '35 or 22', stakes: '10£/side', location: 'England'},
        {date: '1864-01-28', opponent: '"Bingey" Rose', result: 'win', articles: ['007', '084', '148', '234'], details: [], rounds: '10', time: '28 or 22 minutes', stakes: '25£/side', location: 'Nottingham England'},
        {date: '1864-06-02', opponent: 'Bob Smith', result: 'loss', articles: ['084', '007', '148', '203', '234'], details: ['before emigrating', 'Smith was American and Black'], stakes: '5£/side', rounds: '50 or 108 rounds', time: '2hrs 49 min or 3 hours 57 minutes', location: 'England'},
        {date: '1865-06-13', opponent: 'Jack Parkison', result: 'win', articles: ['084', '148', '234'], details: ['before emigrating'], time: '23 or 20 minutes', stakes: '25£/side', rounds: '11', location: 'England'},
        {date: '1865-11-28', opponent: 'Posh Price', result: 'win', articles: ['007', '084', '148', '234'], details: [], time: '2 hours 5 minutes', rounds: '41 or 45', stakes: '50£/side or 25£/side', location: 'England'},
        {date: '1866-06-13', opponent: 'George Iles', result: 'win', articles: ['007', '084', '148', '234'], details: [], rounds: '17 or 15', time: '62 min or 52 minutes or 1hr 2 min', stakes: '100£/side or 25£/side', location: 'England'},
        {date: '1867-03-05', id: '001', opponent: 'Joe Goss', result: 'draw', articles: ['007', '082', '148', '194', '230', '234'], details: ['fought for middleweight championship', '230 says Allen claimed the title by Mace retained the belt'], time: '1 hr 53 min', rounds: '34', stakes: '100£/side', location: 'England'},

        {questionable: true, date: 'pre 1869', opponent: 'Clarke', result: 'win', articles: ['007'], details: [], location: 'England'},
        {questionable: true, date: 'pre 1869', opponent: 'Wight', result: 'win', articles: ['007'], details: [], location: 'England'},
        {questionable: true, date: 'pre 1869', opponent: 'Young', result: 'win', articles: ['007'], details: [], location: 'England'},
        {questionable: true, date: 'pre 1869', opponent: 'J Perkins', result: 'win', articles: ['007'], details: [], location: 'England'},

        {date: '1869-01-12', id: '002', opponent: 'William "Bill" M Davis', result: 'win', articles: ['002', '003', '004', '006', '007', '084', '094', '096', '148', '203', '235'], details: ['163 lbs', `5'9" 3/4`, 'first fight in America', 'Allen declared himself champion of America (although no one was sure why)'], stakes: 'entry $1,000/per side', rounds: '42 or 43', location: 'Chouteau Island St Louis'},
        {date: '1869-02-23', opponent: 'Charlie Gallagher', result: 'loss', articles: ['008', '009', '010', '084', '094', '096', '148', '235'], details: ['Gallagher was a Canadian living in Cleveland', 'knock out'], location: 'Carroll Island (St. Louis)', rounds: '2', time: '3 minutes', stakes: '$1000/side or $2000/side'},
        {plannedOnly: true, date: '1868-03-17', opponent: 'Mike McCoole', result: '?', articles: ['001'], details: ['McCoole was champion of America at the time'], stakes: '$1,000 winnings'},
        {date: '1869-06-15', id: '003', opponent: 'Mike McCoole', result: 'loss (at gunpoint)', articles: [
            '011', '012', '013', '014', '015', '016', '084', '093', '094', '096', '124', '139', '148', '223', '229', '230'
        ], details: [
            'match declared a draw after McCools fans stormed the ring',
            'good quotes in 093 as well as a summary',
            'crowd brandished weapons, ref called it for McCoole the next day',
            '230 says Allen wouldnt concede the title afterwards'
        ], location: 'Fosters Island (St Louis)', stakes: '$1,000/side & championship of America', rounds: '17'},
        {date: '1869-08-17', id: '004', opponent: 'Charlie Gallagher', result: 'win', articles: ['017', '018', '019', '020', '021', '084', '094', '096', '148', '230'], details: ['230 states the crowd rushed the ref and forced him to call the fight for Gallagher'], time: '22 minutes or 11 min', rounds: '17 or 11', location: 'Fosters Island (St Louis)'},
        {date: '1869-11-05', id: '005', opponent: 'Jem Gallagher', result: 'win', articles: ['094'], details: [], stakes: '$1000 against $500'},
        {plannedOnly: true, date: '1869-11-10', opponent: 'Mike McCoole', result: 'not fought', articles: ['023', '024', '031', '093', '094'], details: [], stakes: '$2,500 /side', location: 'in Cincinnati'},
        {date: '1870-05-10', id: '006', opponent: 'Gem Mace', result: 'loss', articles: ['026', '027', '029', '033', '034', '035', '059', '084', '096', '148', '194', '203', '223', '225', '226', '227', '228', '231', '235'],
            details: [
                'Mace is from England',
                'Allen was thrown to the ground with Mace on top of him.  It was thought that Allen may have broken his neck, but he eventually recovered',
                'Mace (already English champion) claimed heavyweight championship of the world, but McCooles previous win over Allen gave him a claim of the american title'
            ], time: '44 min or 50 min', rounds: '10', stakes: '$2,500 and the championship (other reports day $5k/side)',
            location: 'Kennerville or Keanville (New Orleans)'},
        {plannedOnly: true, date: '1870-06-02', opponent: 'Mike McCoole', result: 'none', articles: ['148'], details: ['McCoole forfeit'], stakes: '$2500/side and championship of America'},
        {date: '1870-11-01', id:'007', opponent: 'Jem Gallagher', result: 'win', articles: ['038', '039', '040', '084', '148', '203'], details: ['original fight (1870-11-01) broken up by police', 'moved to Kansas City', 'James "Jem" Cornelius Gallagher is not related to Charles Gallagher.  They met for the first time for this fight.'], stakes: '$500/side', time: '44 minutes', rounds: '15'},
        {date: '1870 fall', opponent: 'Mike McCoole', result: 'win', articles: ['094', '148'], details: [], location: 'Chouteau Island (St Louis)', stakes: '$2500/side and championship of America'},
        {date: '1873-09-23', id: '008', opponent: 'Mike McCoole', result: 'win', articles: ['044', '084', '124', '139', '148', '194', '197', '223', '231', '235'], details: [
            'fight in 1870 was forfeited by McCool (084)',
            'last article (139) lists date at Sept 3',
            '$2000 and the championship (Mace was no longer fighting)',
            'a photo of Allen in his ring outfit from this day used to hang in Allens bar',
        ], rounds: '8 or 7', time: '19 minutes', location: 'St Louis (Chouteau or Bloody Island)'},
        {date: '1873-10 or 1873-11-18', opponent: 'Ben Hogan', result: 'broken up', articles: ['084', '148', '203', '223', '235'], details: [`Allen was winning when Hogan's friends broke into the ring and held pistols to Allen's head`], stakes: '$1000/side and Pacific Coast Championship', time: '6 minutes', rounds: '3'},
        {date: '1876-09-07 (reported once as Sept 10th)', id: '009', opponent: 'Joe Goss', result: 'loss (foul)',
            articles: ['073', '074', '075', '076', '077', '079', '080', '082', '084', '085', '086', '087', '089', '096', '109', '110', '111', '114', '197', '203', '210', '213', '235'],
            details: [
                'Goss is from England',
                'Goss claims the championship of England',
                'Fought broken up by Kentucky malitia.  Allen loses on a foul one paper blames the NY mob.  Allen was said to have struck Goss while he was down',
                'Allen arrested',
                'Goss was temporarily blinded by the fight',
                'Alan and Goss were arrested.  Allen jumped bond and fled to England via Canada.  He paid most of his debt to his bondsman but was arrested in February 1884.',
                'Goss was arrested in NY, spent several months in jail and paid a fine',
                '$2500/side was the largest prize in a fight at the time',
                '203 claims Allen retained the championship title as he should have won the fight',
                '210 has a detailed recap of the fight as told many years later',
                '231 claims the championship was passed to Goss'
            ],
            time: '48 minutes or 1hr 50min',
            rounds: '23 or 21 or 37',
            location: 'Covington Kentucky (across the river from Cincinnati), first in Kenton County then in Boone County',
            stakes: 'for the championship of the world and $1000 or $2500/side',
        },


        {date: '1877-11', id:'10', opponent: 'Thompkins Gilbert', result: 'win', articles: ['090', '148'], details: ['Gilbert claims champion title of England'], location: 'England', rounds: '5', stakes: '100£/side'},
        {date: '1878', id:'11', opponent: 'Charley Davis', result: 'win', articles: ['091', '148', '194', '196', '197'], details: ['Fought with gloves, Queensbury Rules', 'first ever fight under Queensbury rules', 'Allen weights 14 stone (196 lbs)', 'Allen was 39 at the time'], location: 'England', stakes: '200£, the championship of England and a large silver cup', rounds: '5'},
        {date: '1879-03-10', id:'12', opponent: 'Jim Stewart', result: 'win', articles: ['148', '203', '259'], details: [`Allen's last fight`], location: 'England', rounds: '16', stakes: '50£/side', time: '55min'},



        {date: '?', opponent: 'Gem Mace', result: '?', articles: ['048', '049', '050'], details: []},
        {plannedOnly: true, date: '1875-06-17', opponent: 'George Rooke', result: 'canceled', articles: ['057', '058', '084', '094'], details: ['confusion caused only Allen to show. He claimed victory but later decided to reschedule'], location: 'Pittsburgh', stakes: 'for the championship and $3,000'},
        {plannedOnly: true, date: '1978-07-15', opponent: 'George Rooke', result: 'canceled', articles: ['257', '092', '102'], details: ['brother of Jack Rooke', 'in 092 Allen says the match was not serious.. just a show with soft gloves.  He said he broke through the stage floor and fell, and the press wrote it up as a knock out', 'Allen knocked down twice'], stakes: 'for the championship and $1000/side'},
        {date: '1978 ish', opponent: 'Cleary', result: 'win', articles: ['102'], details: ['Allen claims to have beat him just after fighting Rooke']},
        {date: '??', opponent: 'Gem Mace', result: '?', articles: ['059', '062', '065', '070'], details: ['Mace claims championship of England and the World']},
        {date: '?', opponent: 'Joe Coburn', result: '?', articles: ['070', '071', '072', '073'], details: []},
        {date: '?', opponent: 'Joe Goss', result: 'win', articles: ['094'], details: ['1878 article refers to Allen beating Goss in Cincinnati sometime after 1870.  could be crediting Allen for win in Nov 1876 fight.']},
        {plannedOnly: true, date: '1882', opponent: 'John L. Sullivan', result: '?', articles: ['097', '098', '099', '102', '103'], details: ['Allen sick, fight called off', 'another article says Allens backer canceled when he saw how far Allen had been from his prime'], location: 'to fight near Kansas City'},
    ]

// 196 has a questionable account of guns being drawn in a fight with Goss.  Date doesn't match, and accounts don't match other articles.  It also has a lot of other good details, but I don't know if I trust the source

// full listing of fights to be transposed in 203, 202