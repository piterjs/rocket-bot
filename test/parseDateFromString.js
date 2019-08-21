const { expect } = require('chai');
const parseDateFromString = require('../helpers/parseDateFromString');

describe('#parseDateFromString()', () => {
  it('04 Jun 2019 20:00', () => {
    const pd = parseDateFromString('Text 04 Jun 2019 20:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2})\s(\w{3})\s(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD MMM YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
    expect(pd.date.format('YYYY-MM-DD HH:ss')).to.be.equal('2019-06-04 20:00')
  });
  it('04 June 2019 20:00', () => {
    const pd = parseDateFromString('Text 04 June 2019 20:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2})\s(\w{4,9})\s(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD MMMM YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
    expect(pd.date.format('YYYY-MM-DD HH:ss')).to.be.equal('2019-06-04 20:00')
  });
  it('2019-06-04 20:00', () => {
    const pd = parseDateFromString('Text 2019-06-04 20:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{4})-(\d{1,2})-(\d{1,2})\s(\d{1,2}):(\d{1,2})/i,
        format: 'YYYY-MM-DD HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
    expect(pd.date.format('YYYY-MM-DD HH:ss')).to.be.equal('2019-06-04 20:00')
  });
  it('04-06-2019 20:00', () => {
    const pd = parseDateFromString('Text 04-06-2019 20:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2})-(\d{1,2})-(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD-MM-YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
    expect(pd.date.format('YYYY-MM-DD HH:ss')).to.be.equal('2019-06-04 20:00')
  });
  it('04.06.2019 20:00', () => {
    const pd = parseDateFromString('Text 04.06.2019 20:00 other text');
    expect(pd)
      .to.be.an('object')
      .to.deep.include({
        rexp: /(\d{1,2}).(\d{1,2}).(\d{4})\s(\d{1,2}):(\d{1,2})/i,
        format: 'DD.MM.YYYY HH:mm'
      });
    expect(pd).to.be.an.instanceOf(Object);
    expect(pd.date.format('YYYY-MM-DD HH:ss')).to.be.equal('2019-06-04 20:00')
  });
  it('No date', () => {
    expect(() => parseDateFromString('Text other text')).to.throw(Error, 'Invalid date');
  });
  it('Wrong date 20.20.2019', () => {
    expect(() => parseDateFromString('Text 20.20.2019 other text')).to.throw(Error, 'Invalid date');
  });
});
