# ftp-deploy

Deploy a static site via ftp.
Existing site will be moved to a backup directory named `html.bak.#` where `#` will be incremented for every deployment.

**This repository is archived:**

- Functionality is no longer needed; its provided by a hosting service.
- There are several code vulnerabilities that need fixing before this project can be used outside of testing.

# usage

Add the following to the scripts section of `package.json`:

```javascript
"deploy": "peyotl --domain domain --host host --user user --pw password [--stage stage] [--local local]"
```

# options

- **host**: Hostname of the FTP server.
- **user**: Username credential.
- **pw**: Password credential. Special characters may need to be escaped. For example: `--pw Ac\\[o\\*sD`
- **domain**: Path on the server where the deployment will be staged. Also where the `html` directory lives.
- **stage**: Optional name to use for the staging directory. Defaults to `html.stage`
- **local**: Optional location of static site to upload. Defaults to `public`. Must not contain any relative directory references; i.e., `build` is ok, but `./build` will result in an error.

# todo

- Provide a secure method for setting the password.
- Rollback a version.
  - Rollback latest
  - Rollback by backup #
- Make `buildManifest` usage of localDir robust. Specifying `./dir` instead of `dir` will cause a failure.
- Update repo and files to reference the package name: `peyotl`.
- Add tests for ftp processing. I'm sure there are many real-world situations that ere not accounted-for in the code.
- Add configuration for the name of the HTML directory. Currently hardcoded to `html`.
- Rearchitect to do an in-place synchronization.
  - Continue to offer "stage and copy" as an option?
  - Provide a dry-run feature.
  - Make the dry-run interactive (perform sync on approval).
- Track versions (based on `package.json` `"version"` configuration)
  - Don't allow deployment if version already exists (like `npm publish`)
  - Display available versions.
  - Roll forward / roll back
