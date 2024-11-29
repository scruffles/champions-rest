var tesseract = require('node-tesseract')

let options = {
    l: 'eng',
    psm: 6,
}

tesseract.process('../public/images/articles/image-001c.jpg', options, (err, text) => {
    console.log(err, text)
})