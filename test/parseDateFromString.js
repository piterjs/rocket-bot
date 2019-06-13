const { expect } = require('chai');
const moment = require('moment');
const parseDateFromString = require('../helpers/parseDateFromString');

describe('#parseDateFromString()', () => {
  it('04 Jun 2019 13:00', () => {
    const pd = parseDateFromString('Text 04 Jun 2019 13:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2})\s(\w{3})\s(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD MMM YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
  });
  it('04 June 2019 13:00', () => {
    const pd = parseDateFromString('Text 04 June 2019 13:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2})\s(\w{4,9})\s(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD MMMM YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
  });
  it('2019-06-04 13:00', () => {
    const pd = parseDateFromString('Text 2019-06-04 13:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{4})-(\d{1,2})-(\d{1,2})\s(\d{1,2}):(\d{1,2})/i,
        format: 'YYYY-MM-DD HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
  });
  it('04-06-2019 13:00', () => {
    const pd = parseDateFromString('Text 04-06-2019 13:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2})-(\d{1,2})-(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD-MM-YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
  });
  it('04.06.2019 13:00', () => {
    const pd = parseDateFromString('Text 04.06.2019 13:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2}).(\d{1,2}).(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD.MM.YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
  });
  it('No date', () => {
    expect(() => parseDateFromString('Text other text')).to.throw(Error, 'Invalid date');
  });
  it('Wrong date 20.20.2019 13:00', () => {
    expect(() => parseDateFromString('Text 20.20.2019 other text')).to.throw(Error, 'Invalid date');
  });
});
