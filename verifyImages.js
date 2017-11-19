const _ = require('underscore')
const db = require('./database')
const moment = require('moment')
const fs = require('fs')

const byDate = _(db).sortBy((rec) => {
    return moment(rec['sourceDate'], 'YYYY-MM-DD').valueOf()
})

byDate.forEach((rec) => {
    if (!fs.existsSync(`public/images/articles/${rec.localCopyFull}`))
        console.log(rec.localCopyFull)
})
