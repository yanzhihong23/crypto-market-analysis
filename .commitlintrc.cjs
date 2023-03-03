module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'style', 'chore', 'perf', 'docs', 'build', 'ci', 'revert', 'test'
    ]]
  }
}