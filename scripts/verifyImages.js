const _ = require("underscore");
const db = require("../data/database");
const moment = require("moment");
const fs = require("fs");

const byDate = _(db).sortBy((rec) => {
  return moment(rec["sourceDate"], "YYYY-MM-DD").valueOf();
});

byDate.forEach((rec) => {
  // localCopyFull is one path or a list of paths
  [].concat(rec.localCopyFull || []).forEach((file) => {
    if (!fs.existsSync(`public/images/articles/${file}`)) console.log(file);
  });
});
