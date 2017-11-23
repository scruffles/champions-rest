const _ = require('underscore')
const db = require('./data/database')
const moment = require('moment')
const fs = require('fs')

const byDate = _(db).sortBy((rec) => {
    return moment(rec['sourceDate'], 'YYYY-MM-DD').valueOf()
})

let count = 0;

function pad(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

byDate.forEach((rec) => {
    rec.id = pad(count, 3)
    const oldLocation = `public/images/articles/${rec.localCopyFull}`
    if (fs.existsSync(oldLocation)) {
        rec.localCopyFull = `public/images/articles/final/image-${rec.id}b.jpg`
        fs.copyFileSync(oldLocation, rec.localCopyFull)
        fs.unlinkSync(oldLocation)
    }
    const oldLocationEdited = `public/images/articles/${rec.localCopyEdited}`
    if (fs.existsSync(oldLocationEdited)) {
        rec.localCopyEdited = `public/images/articles/final/image-${rec.id}.jpg`
        fs.copyFileSync(oldLocationEdited, rec.localCopyEdited)
        fs.unlinkSync(oldLocationEdited)
    }
    count++
})

console.log(JSON.stringify(byDate, null, '   '))
