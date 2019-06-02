const bot = require('bbot');
const moment = require('moment');
const nanoid = require('nanoid');
const ics = require('ics');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const parseMeet = msg => {
  msg = msg.replace('!meet', '');
  msg = msg.replace(process.env.BOT_NAME, '');
  const hdate = /(\d{1,2})\s(\w{3,9})\s(\d{2,4})\s(\d{1,2}):(\d{1,2})/i;
  const idate = /(\d{2,4})-(\d{1,2})-(\d{1,2})\s(\d{1,2}):(\d{1,2})/i;
  const isH = hdate.test(msg);
  const isI = idate.test(msg);
  if (!isH && !isI) {
    throw new Error('Invalid date');
  }
  let date = null;
  if (isH) {
    date = moment(hdate.exec(msg)[0]);
  } else {
    date = moment(idate.exec(msg)[0]);
  }
  if (!date.isValid()) {
    throw new Error('Invalid date');
  }
  if (date.isBefore(moment().subtract(10, 'minutes'))) {
    throw new Error(
      "We can't go back in time, but if you have a time machine mail me!"
    );
  }
  date = date.format('DD MMMM YYYY hh:mm');
  msg = msg.replace(isH ? hdate : idate, '');
  let invites = [];
  const title = msg
    .split(' ')
    .filter(v => v && v.length > 0)
    .filter(v => {
      if (v.includes('@') || v.startsWith('#')) {
        invites.push(v);
        return false;
      }
      return true;
    })
    .join(' ');
  const url = `https://meet.jit.si/PiterJS_${nanoid()}`;
  return { date, title, invites, url };
};

const meetings = {};

const createEvent = event =>
  new Promise((resolve, reject) => {
    ics.createEvent(event, (err, val) => {
      if (err) {
        reject(err);
      } else {
        resolve(val);
      }
    });
  });

const initMeet = async b => {
  const {
    user: { id },
    text
  } = b.message;
  try {
    const meet = parseMeet(text);
    const { title, date, invites } = meet;
    const ucList = invites.filter(v => v.startsWith('#') || v.startsWith('@'));
    let invList = [];
    const resOwner = await bot.adapters.message.api
      .get('users.list', {
        fields: { emails: 1, name: 1, username: 1 },
        query: { _id: id }
      })
      .catch(() => null);
    const own = {
      ...resOwner.users[0],
      email: resOwner.users[0].emails[0].address
    };
    delete own.emails;
    invList.push(own);
    for (const title of ucList) {
      if (title.startsWith('@')) {
        const res = await bot.adapters.message.api
          .get('users.list', {
            fields: { emails: 1, name: 1, username: 1 },
            query: { username: title.slice(1) }
          })
          .catch(() => null);
        if (res && res.count > 0) {
          const {
            users: [user]
          } = res;
          user.email = user.emails[0].address;
          delete user.emails;
          invList.push(user);
        }
      } else {
        const q = {
          roomName: title.slice(1)
        };
        let members = await bot.adapters.message.api
          .get('groups.members', q)
          .catch(() => null);
        if (!members) {
          members = await bot.adapters.message.api
            .get('channels.members', q)
            .catch(() => null);
        }
        if (members && members.count > 0) {
          const m = members.members
            .filter(v => invList.findIndex(({ _id }) => _id === v._id) === -1)
            .map(v => v._id);
          const res = await bot.adapters.message.api
            .get('users.list', {
              fields: { emails: 1, name: 1, username: 1 },
              query: { _id: { $in: m } }
            })
            .catch(() => null);
          invList = invList.concat(
            res.users.map(v => {
              v.email = v.emails[0].address;
              delete v.emails;
              return v;
            })
          );
        }
      }
    }
    meet.org = invList.find(v => v._id === id);
    meet.invites = invList.filter(
      v => v._id !== id && !v.username.includes('.bot')
    );
    invites.forEach(v => {
      if (!v.startsWith('#') && !v.startsWith('@')) {
        meet.invites.push({ name: v, email: v });
      }
    });
    meetings[id] = meet;
    b.envelope.write(`_Meeting:_
*Title:* ${title}
*Date:* ${date}
*Organizer:* ${meet.org.name}
*Invites:* ${meet.invites.map(v => (v.name ? v.name : v.email)).join(' ')}
\`!meet create\` - to create`);
  } catch (err) {
    b.envelope.write(`Error: ${err.message}`);
  }
  b.respond();
};

const createMeet = async b => {
  const {
    user: { id }
  } = b.message;
  if (id in meetings) {
    const { title, date, url, org, invites } = { ...meetings[id] };
    console.log(meetings[id]);
    const dd = moment(date);
    const data = {
      start: [
        dd.format('YYYY'),
        dd.format('M'),
        dd.format('D'),
        dd.format('h'),
        dd.format('m')
      ],
      duration: { hours: 1 },
      title,
      url,
      status: 'CONFIRMED',
      organizer: {
        name: org.name,
        email: org.email
      },
      attendees: invites.map(({ name, email }) => ({ name, email, rsvp: true }))
    };

    const event = await createEvent(data).catch(err => {
      console.log(err);
      return {};
    });
    if (!event) {
      b.envelope.write('Error: Error creating event');
    } else {
      try {
        const msg = {
          from: process.env.SMTP_FROM,
          to: `"${data.organizer.name}" <${
            data.organizer.email
          }>, ${invites
            .map(({ name, email }) => `"${name}" <${email}>`)
            .join(', ')}`,
          subject: `Invite to ${data.title} from ${data.organizer.name}`,
          text: `Invite to ${data.title} from ${data.organizer.name}`,
          html: `<p>Invite to ${data.title} from ${data.organizer.name}</p>`,
          attachments: [{ filename: 'invite.ics', content: event }]
        };
        const info = await transporter.sendMail(msg);
        b.envelope.write(`_Meeting was sended!_ Waiting you at ${date}`);
      } catch (err) {
        b.envelope.write('Error: sending email');
      }
    }
    delete meetings[id];
  } else {
    b.envelope.write('Error: You do not have ready to send meeting');
  }
  b.respond();
};

bot.global.direct(/!meet/, async b => {
  const {
    user: {
      room: { type }
    },
    text
  } = b.message;
  if (type !== 'd') {
    return;
  }
  if (/!meet\screate/.test(text)) {
    createMeet(b);
  } else {
    initMeet(b);
  }
});
