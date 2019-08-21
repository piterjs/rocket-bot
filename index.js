const bot = require('bbot');

const http = require('http');
const handle = (req, res) => res.end('hit');
const server = http.createServer(handle);
server.listen(process.env.PORT || 5000);

require('./src/calendar');
require('./src/invite');
require('./src/help');

setTimeout(() => {
  if (bot.getStatus() !== 'started') {
    process.exit(1);
  }
}, 21000);
bot.start();

