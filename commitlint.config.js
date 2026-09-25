module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserOpts: {
    headerPattern: /^(\w+)(?:\((.*)\))?(!)?:\s(.*)$/,
    headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
  },
};