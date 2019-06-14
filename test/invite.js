const { expect } = require('chai');
const sinon = require('sinon');
const bot = require('bbot');
const rewire = require('rewire');

const invite = rewire('../src/invite');

const sandbox = sinon.createSandbox();

let ir = null;
const FQ = require('./utils/fakeQuery');
const adapters = require('./utils/adapters');

describe('invite.js', () => {
  before(() => {
    ir = process.env.INVITE_ROLES;
    process.env.INVITE_ROLES = 'test, test1';
    sandbox.replace(bot, 'adapters', adapters);
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
      const fq = new FQ('botname: !invite', 0);
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal('Forbidden');
    });
    it('forbidden - user without role', async () => {
      const fq = new FQ('botname: !invite', 1);
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal('Forbidden');
    });
    it('email or room not set', async () => {
      const fq = new FQ('botname: !invite');
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal('Error: email or room not set');
      const fq2 = new FQ('botname: !invite #room');
      await f(fq2);
      expect(fq2.result)
        .to.be.a('string')
        .and.to.equal('Error: email or room not set');
      const fq3 = new FQ('botname: !invite user@email');
      await f(fq3);
      expect(fq3.result)
        .to.be.a('string')
        .and.to.equal('Error: email or room not set');
    });
    it('room not found', async () => {
      const fq = new FQ('botname: !invite user@email #room');
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal(`channel: *#room* not found`);
    });
    it('user already registred - public channel', async () => {
      const fq = new FQ('botname: !invite user@email #test');
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal(`Already registred, *Test* invited to channel: *#test*`);
    });
    it('user already registred - private group', async () => {
      const fq = new FQ('botname: !invite user@email #test_private');
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal(
          `Already registred, *Test* invited to channel: *#test_private*`
        );
    });
    it('user invited - public channel', async () => {
      const fq = new FQ('botname: !invite user@email.com #test');
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal(
          `user: *user@email.com* invited by email to channel: *#test*`
        );
    });
    it('user invited - private group', async () => {
      const fq = new FQ('botname: !invite user@email.com #test_private');
      const f = invite.__get__('invite');
      await f(fq);
      expect(fq.result)
        .to.be.a('string')
        .and.to.equal(
          `user: *user@email.com* invited by email to channel: *#test_private*`
        );
    });
  });
});
