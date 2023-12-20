#!/bin/bash

# Because of the monorepo structure, license-check from generate-license-file lib is an unable
# to properly parse all the relevant depedencies in the node_modules of a package. This script
# will temporarily copy the target package outside of the packages/ to generate the
# third-party-notice file and add it to the package.


PACKAGE_DIR=$(pwd)
REPO_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
echo "copying package $PACKAGE_DIR to $REPO_DIR/temp"
rm -rf "$REPO_DIR/temp"
cp -r $PACKAGE_DIR "$REPO_DIR/temp"
cd "$REPO_DIR/temp" && npm i --ignore-scripts
generate-license-file --input package.json --output THIRD-PARTY-NOTICES --overwrite
cp "$REPO_DIR/temp/THIRD-PARTY-NOTICES" $PACKAGE_DIR
rm -rf "$REPO_DIR/temp"