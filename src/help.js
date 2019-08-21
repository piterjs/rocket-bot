const bot = require('bbot');

function help(b) {
  b.respond(`*Commands:*
\`!invite invite@email.dev #channel_name\` - invite user by email to channel (if user already registred invite user to channel)
\`!meeting Meetings name (4 Jun 2019 13:00|2019-06-04 13:00|04.06.2019 13:00|04-06-2019 13:00) @user #channel meet@email.dev\` - create meeting
\`!meetup Meetup name (4 Jun 2019 13:00|2019-06-04 13:00|04.06.2019 13:00|04-06-2019 13:00)\` - create new meetup
`)
}

bot.global.text(/!help/, help);
