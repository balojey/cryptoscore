import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  ignores: [
    '**/*.md',
    '**/dist/**',
    '**/node_modules/**',
  ],
})
