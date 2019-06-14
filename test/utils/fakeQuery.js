module.exports = function fakeQuery(text, id = 2) {
  this.result = '';
  const wr = t => (t ? (this.result += t) : null);
  this.respond = wr;
  this.envelope = {
    write: wr
  };
  this.message = {
    user: { id },
    text
  };
  return this;
};
