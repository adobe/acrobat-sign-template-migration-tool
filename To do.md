# To do

- initialize `sourceComplianceLevel` and `destComplianceLevel` to the default values that are used in the .html instead of hardcoding their initial values to match those from the .html

- type arguments with types such as `'option1' | 'option2'` in functions where applicable

  - e.g. `complianceLevel` should always be of type `'commercial' | 'fedramp'`

- remove need for direct call to axios (sending `data` with `JSON.stringify()` and then deserializing with `JSON.parse()` should probably work)

- improve UI

- change ' to "

- use Angular to inject `window` instead of using `<any> window`

- error handling for incorrect password

- convert settings.ts into an environment variable file that Angular natively supports; even better would be an env var file that both Electron main process and renderer process load upon starting


# Irrelevant errors that may become relevant

- when I use the correct spoke (na4) to log in to source account, no error occurs with the login. when I use the spoke na1, which is incorrect, to attempt to log into the source account, I get an error resulting from the fact that, at some point, `shard` is `''` (it is likely that `shard` is `''` in `loginHelper()`; maybe `_sourceShard` and `_destShard` aren't getting updated)
