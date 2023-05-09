module.exports = {
  presets: [
    '@babel/preset-env',
    // enables a new JSX transform introduced in React 17 that uses the
    // React runtime to generate necessary code for JSX expressions.
    ['@babel/preset-react', { 'runtime': 'automatic' }],
    '@babel/preset-typescript',
  ],
};