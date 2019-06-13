const { expect } = require('chai');
const sinon = require('sinon');
const bot = require('bbot');
const rewire = require('rewire');

const invite = rewire('../src/invite');

const sandbox = sinon.createSandbox();

let ir = null;
let r = '';
const fakeQuery = {
  respond: t => (t ? (r += t) : null),
  envelope: {
    write: t => (r += t)
  },
  message: {
    user: { id: 0 },
    text: ''
  }
};

describe('invite.js', () => {
  before(() => {
    ir = process.env.INVITE_ROLES;
    process.env.INVITE_ROLES = 'test, test1';
    sandbox.replace(bot, 'adapters', {
      message: {
        api: {
          post: async (method, params) => {
            return new Promise(resolve => {
              let r = null;
              if (['channels.invite', 'groups.invite'].includes(method)) {
                r = { method, params };
              } else if (method === 'users.create') {
                r = { user: { _id: 321 } };
              }
              resolve(r);
            });
          },
          get: async (method, params) => {
            return new Promise(resolve => {
              let r = null;
              if (method === 'users.info') {
                if (params.userId === 1) {
                  r = { user: { id: params.userId, roles: [] } };
                } else if (params.userId === 2) {
                  r = { user: { id: params.userId, roles: ['test'] } };
                }
              } else if (method === 'groups.info') {
                if (params.roomName === 'test') {
                  r = { group: { _id: 1, t: 'c' } };
                } else if (params.roomName === 'test_private') {
                  r = { group: { _id: 2, t: 'p' } };
                }
              } else if (method === 'users.list') {
                if (params.query['emails.address'] === 'user@email') {
                  r = { count: 1, users: [{ _id: 1, name: 'Test' }] };
                } else {
                  r = { count: 0, users: [] };
                }
              }
              resolve(r);
            });
          }
        }
      }
    });
  });
  after(() => {
    if (ir) {
      process.env.INVITE_ROLES = ir;
    }
    sandbox.restore();
  });
  describe('#generatePassword()', () => {
    it('check password generate', () => {
      const f = invite.__get__('generatePassword');
      let r = f();
      expect(r)
        .to.be.a('string')
        .and.to.have.lengthOf(8);
      expect(r).to.not.equal(f());
    });
  });
  describe('#invite()', () => {
    it('forbidden - user not found', async () => {
      r = '';
      fakeQuery.message.text = 'botname: !invite';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal('Forbidden');
    });
    it('forbidden - user without role', async () => {
      r = '';
      fakeQuery.message.user.id = 1;
      fakeQuery.message.text = 'botname: !invite';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal('Forbidden');
    });
    it('email or room not set', async () => {
      r = '';
      fakeQuery.message.user.id = 2;
      fakeQuery.message.text = 'botname: !invite';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal('Error: email or room not set');
      r = '';
      fakeQuery.message.text = '!invite #room';
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal('Error: email or room not set');
    });
    it('room not found', async () => {
      r = '';
      fakeQuery.message.text = 'botname: !invite user@email #room';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal(`channel: *#room* not found`);
    });
    it('user already registred - public channel', async () => {
      r = '';
      fakeQuery.message.text = 'botname: !invite user@email #test';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal(`Already registred, *Test* invited to channel: *#test*`);
    });
    it('user already registred - private group', async () => {
      r = '';
      fakeQuery.message.text = 'botname: !invite user@email #test_private';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal(
          `Already registred, *Test* invited to channel: *#test_private*`
        );
    });
    it('user invited - public channel', async () => {
      r = '';
      fakeQuery.message.text = 'botname: !invite user@email.com #test';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal(
          `user: *user@email.com* invited by email to channel: *#test*`
        );
    });
    it('user invited - private group', async () => {
      r = '';
      fakeQuery.message.text = 'botname: !invite user@email.com #test_private';
      const f = invite.__get__('invite');
      await f(fakeQuery);
      expect(r)
        .to.be.a('string')
        .and.to.equal(
          `user: *user@email.com* invited by email to channel: *#test_private*`
        );
    });
  });
});
