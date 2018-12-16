# ftp-deploy

Deploy a static site via ftp.

Existing site will be moved to a backup directory.
Add to scripts section of package.json:

```javascript
"deploy": "peyotl --domain domain --host host --user user --pw password [--stage stage] [--local local]"
```

# Options

- domain: `'path-on-server'`
- host: `'hostname'`
- user: `'username'`
- pw: `'password'`
- stage: `'html.stage'`
- local: `'public'`
