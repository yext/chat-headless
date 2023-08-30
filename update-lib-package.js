// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const packagePathToType = {
  "./dist/esm/package.json": "module",
  "./dist/commonjs/package.json": "commonjs",
}

Object.entries(packagePathToType).forEach(([packageJsonPath, type]) => {
  // Read the package.json file
  fs.readFile(packageJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading package.json: ${err}`);
      return;
    }

    try {
      // Parse the package.json content
      const packageJson = JSON.parse(data);

      // Add "type: module" or "type: commonjs" to the package.json
      packageJson.type = type;

      // Write the updated package.json back to the file
      fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
        if (err) {
          console.error(`Error writing package.json: ${err}`);
          return;
        }
        console.log(`Added "type: ${type}" to ${packageJsonPath}`);
      });
    } catch (err) {
      console.error(`Error parsing package.json: ${err}`);
    }
  });
})
