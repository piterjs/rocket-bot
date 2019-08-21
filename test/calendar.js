const { expect } = require('chai');
const sinon = require('sinon');
const bot = require('bbot');
const rewire = require('rewire');

const calendar = rewire('../src/calendar');

const sandbox = sinon.createSandbox();

const FQ = require('./utils/fakeQuery');
const adapters = require('./utils/adapters');

describe('calendar.js', () => {
  before(() => {
    sandbox.stub(process.env, 'BOT_NAME').value('botname');
    sandbox.replace(bot, 'adapters', adapters);
  });
  after(() => {
    sandbox.restore();
  });

  describe('#transporter', () => {
    it('check transporter options', () => {
      const t = calendar.__get__('transporter');
      expect(t.options).to.be.deep.include({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    });
  });
  describe('#parseMeet()', () => {
    const f = calendar.__get__('parseMeet');
    it('meeting created', () => {
      const m = {
        title: 'Test name',
        date: '04 June 2050 13:00',
        invites: ['@test', '#test', 'test@email']
      };
      const nm = f(
        `${process.env.BOT_NAME} !meeting ${m.title} ${m.date} ${m.invites.join(
          ' '
        )}`
      );
      expect(nm).to.be.deep.includes(m);
    });
    it('meeting created without date', () => {
      const m = {
        title: 'Test name',
        date: '',
        invites: ['@test', '#test', 'test@email']
      };
      const nm = () =>
        f(
          `${process.env.BOT_NAME} !meeting ${m.title} ${m.date} ${m.invites.join(
            ' '
          )}`
        );
      expect(nm).to.throw(Error, 'Invalid date');
    });
    it('meeting created without invites', () => {
      const m = {
        title: 'Test name',
        date: '04 June 2050 13:00',
        invites: []
      };
      const nm = f(
        `${process.env.BOT_NAME} !meeting ${m.title} ${m.date} ${m.invites.join(
          ' '
        )}`
      );
      expect(nm).to.be.deep.includes(m);
    });
  });
  describe('#createEvent()', () => {
    const f = calendar.__get__('createEvent');
    it('event created', async () => {
      const ev = {
        start: [2019, 6, 4, 13, 0],
        duration: { hours: 1 },
        title: 'Test',
        status: 'CONFIRMED',
        organizer: {
          name: 'Test',
          email: 'test@test.com'
        },
        attendees: [{ name: 'Test 1', email: 'test1@test.com', rsvp: true }]
      };
      const m = await f(ev);
      expect(m).to.be.a('string');
    });
  });
  describe('#initMeet()', () => {
    const f = calendar.__get__('initMeet');
    it('init meeting', async () => {
      const fq = new FQ(
        '!meeting Meetings name 4 Jun 2050 13:00 @user #channel meet@email.de'
      );
      await f(fq);
      expect(fq.result).to.be.a('string').and.equal(`_Meeting:_
*Title:* Meetings name
*Date:* 04 June 2050 13:00
*Organizer:* Test 2
*Invites:* Test 1 meet@email.de
\`!meeting create\` - to create`);
    });
  });
});
