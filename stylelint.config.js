module.exports = {
  customSyntax: 'postcss-html',
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  rules: {
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates'],
      },
    ],
    'color-function-notation': 'legacy',
    'alpha-value-notation': 'number',
    'property-no-vendor-prefix': null,
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'value-no-vendor-prefix': null,
  },
}
