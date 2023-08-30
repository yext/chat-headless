module.exports = {
  webpack: {
      configure: {
          module: {
              rules: [
                  //This rule is to escape the error of requiring .mjs/.js extension due
                  //to origin being strict ESM (package.json contains '"type": "module"')
                  //https://webpack.js.org/configuration/module/#resolvefullyspecified
                  {
                      test: /\.m?js$/,
                      resolve: {
                          fullySpecified: false,
                      },
                  },
              ],
          },
      },
  },
};