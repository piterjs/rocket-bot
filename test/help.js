const { expect } = require('chai');
const rewire = require('rewire');

const help = rewire('../src/help');

describe('help.js / #help()', () => {
  it('respond help', () => {
    let r = null;
    help.__get__('help')({ respond: t => (r = t) });
    expect(r).to.be.a('string');
    expect(r).to.include('*Commands:*');
  });
});
