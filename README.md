# ftp-deploy

Deploy a static site via ftp.

Existing site will be moved to a backup directory.
Add to scripts section of package.json:

```javascript
"deploy": "node js/ftp-deploy.js"
```

# Options

domain: `'directory-path-on-server/'`
stageDir: `'html.stage/'`
localDir: `'public/'`
ftp.host: `'hostname'`
ftp.user: `'username'`
ftp.password: `'password'`
