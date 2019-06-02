const bot = require('bbot');

bot.global.direct(/!invite/, async b => {
  const pm = b.message.text.split(' ').filter(v => v && v.length > 0);
  pm.splice(0, 2);
  let email = null;
  let roomName = null;
  pm.forEach(v => {
    if (v.includes('@')) {
      email = v;
    } else if (v.startsWith('#')) {
      roomName = v.replace('#', '');
    }
  });
  if (!email || !roomName) {
    b.envelope.write('Error: email or room not set');
    b.respond();
    return;
  }
  const q = {
    roomName
  };
  let room = await bot.adapters.message.api
    .get('groups.info', q)
    .catch(() => null);
  if (!room) {
    room = await bot.adapters.message.api
      .get('channels.info', q)
      .catch(() => null);
  }
  if (!room) {
    b.envelope.write(`channel: *#${roomName}* not found`);
  } else {
    const qu = {
      fields: { name: 1, emails: 1 },
      query: {
        'emails.address': email
      }
    };
    const {
      group: { _id: roomId, t }
    } = room;
    let userId = null;
    const users = await bot.adapters.message.api
      .get('users.list', qu, true)
      .catch(() => null);
    if (users.count > 0) {
      const {
        users: [{ _id, name }]
      } = users;
      userId = _id;
      b.envelope.write(
        `Already registred, *${name}* invited to channel: *#${roomName}*`
      );
    } else {
      const nu = {
        email,
        name: email.split('@')[0],
        password: 'iLovePiterJS',
        username: email.split('@')[0],
        roles: ['user'],
        requirePasswordChange: true,
        sendWelcomeEmail: true
      };
      const usr = await bot.adapters.message.api
        .post('users.create', nu)
        .catch(() => null);
      const {
        user: { _id }
      } = usr;
      userId = _id;
      b.envelope.write(
        `user: *${email}* invited by email to channel: *#${roomName}*`
      );
    }
    const qi = {
      roomId,
      userId
    };
    let res;
    if (t === 'c') {
      await bot.adapters.message.api
        .post('channels.invite', qi)
        .catch(err => console.error(err));
    } else if (t === 'p') {
      await bot.adapters.message.api
        .post('groups.invite', qi)
        .catch(err => console.error(err));
    }
  }
  b.respond();
});
