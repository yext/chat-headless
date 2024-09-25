## Testing Process

### Unit Testing

We use Jest as our framework for unit tests. Execute the unit tests with the following command:

```
npm run test
```

### Test Site

To facilitate manual verification, a React test site has been set up in `apps/test-site`. This site currently already have an App component that interfaces with the local `chat-headless-react` library. There are two methods to test the `chat-headless` library:

- Have chat-headless-react import the local chat-headless build. Then, the test site will receive the local changes when interfacing with chat-headless-react.
- Update the test site import the local chat-headless to test state update. You would need to create a new component to interface with chat-headless library.

See Chat SDK wiki on how to link to local build.

To set up the test site, make sure you have a `.env` file configured following the `.sample.env` file. Then, run the following commands:

```
npm i
npm run start
```

## Build Process

Before initiating the build, run the linting process to identify and address any errors or warnings. Use the following command:

```
npm run lint
```

To build the library, execute:

```
npm run build
```

This will create the bundle in the `/dist` directory. This command will also generate documentation files and the `THIRD-PARTY-NOTICES` file.

For guidelines on pull request and version publish process, visit Chat SDK wiki page.
