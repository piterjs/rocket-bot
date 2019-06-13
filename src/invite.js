const bot = require('bbot');

function generatePassword() {
  var length = 8,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    retVal = '';
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

async function invite(b) {
  const {
    user: { id },
    text
  } = b.message;

  const rolesEnv = process.env.INVITE_ROLES || '';
  const invRoles = rolesEnv.split(',');

  const user = await bot.adapters.message.api
    .get('users.info', { userId: id })
    .catch(() => null);

  if (!user || !user.user || !user.user.roles) {
    b.respond('Forbidden');
    return;
  }
  const hasRole = user.user.roles.find(v => invRoles.includes(v));
  if (!hasRole) {
    b.respond('Forbidden');
    return;
  }

  const pm = text.split(' ').filter(v => v && v.length > 0);
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
    b.respond('Error: email or room not set');
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
        password: generatePassword(),
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
}

bot.global.direct(/!invite/, invite);
