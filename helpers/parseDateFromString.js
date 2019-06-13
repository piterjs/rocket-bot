const moment = require('moment');

module.exports = function parseDateFromString(str) {
  const fd = [
    [/(\d{1,2})\s(\w{3})\s(\d{4})\s(\d{1,2}):(\d{1,2})/i, 'DD MMM YYYY HH:mm'],
    [
      /(\d{1,2})\s(\w{4,9})\s(\d{4})\s(\d{1,2}):(\d{1,2})/i,
      'DD MMMM YYYY HH:mm'
    ],
    [/(\d{4})-(\d{1,2})-(\d{1,2})\s(\d{1,2}):(\d{1,2})/i, 'YYYY-MM-DD HH:mm'],
    [/(\d{1,2})-(\d{1,2})-(\d{4})\s(\d{1,2}):(\d{1,2})/i, 'DD-MM-YYYY HH:mm'],
    [/(\d{1,2}).(\d{1,2}).(\d{4})\s(\d{1,2}):(\d{1,2})/i, 'DD.MM.YYYY HH:mm']
  ];
  let df = null;
  for (let i = 0; i < fd.length; i += 1) {
    if (fd[i][0].test(str)) {
      df = fd[i];
      i = fd.length;
    }
  }
  if (!df) {
    throw new Error('Invalid date');
  }
  const [rexp, format] = df;
  const [dateStr] = rexp.exec(str);
  const date = moment(dateStr, format);
  if (!date.isValid()) {
    throw new Error('Invalid date');
  }
  return { date, rexp, format };
};
