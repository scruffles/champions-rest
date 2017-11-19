const _ = require('underscore')
const db = require('./database')
const moment = require('moment')

const byDate = _(db).sortBy((rec) => {
    // console.log(rec['sourceDate'], moment(rec['sourceDate'], 'YYYY-MM-DD'), moment(rec['sourceDate'], 'YYYY-MM-DD').valueOf())
    return moment(rec['sourceDate'], 'YYYY-MM-DD').valueOf()
})

const summaryByDate = byDate.map((rec) => _(rec).pick('title', 'publication', 'summary', 'sourceDate'))

console.log(JSON.stringify(summaryByDate, null, '   '))

// byDate.forEach((rec) => console.log(`${rec['sourceDate']} ${rec.title}`))
