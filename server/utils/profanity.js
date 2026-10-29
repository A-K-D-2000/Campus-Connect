const { Filter } = require('bad-words');

const filter = new Filter();

// Returns true if ANY of the given texts contains profanity
const containsProfanity = (...texts) => {
  return texts.some((t) => typeof t === 'string' && filter.isProfane(t));
};

module.exports = { containsProfanity };