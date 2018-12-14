/**
 * Deploys a static site using FTP.
 * Existing site will be moved to a backup directory.
 */

// Requires Dev dependencies:
// npm install file-system
// npm install promise-ftp
// npm install bluebird
// Useful (?) for typescript?
// npm install @types/ftp
// npm install @types/bluebird-global

var Promise = require('bluebird');
var fileSystem = require('file-system');
var PromiseFtp = require('promise-ftp');
  
var ftp = new PromiseFtp();

var opts = {
  domain: '',
  stageDir: 'html.stage/',
  localDir: 'public/',
  ftp: {
      host: '',
      user: '',
      password: '',
  }
}

/**
 * File specification for deployment.
 * @param {string} path pathname of local directory entry
 * @param {boolean} isFile true if the directory entry is a file
 * @param {string} remotePath full path to remote destination.
 */
function FileSpec(path, isFile, remotePath) {
  this.path = path;
  this.isFile = isFile;
  this.remotePath = remotePath;
}

/**
 * Builds a manifest of file specifications for static site.
 * @param {string} path full or relative pathname of the static site directory.
 * @param {string} remoteDirectory full pathname on remote server.
 */
function buildManifest(path, remoteDirectory, root = path) {
  var manifest = [];
  fileSystem.recurseSync(path, ['[^.]*.*'], 
    function(filepath, relative, filename) {
      const remoteName = filepath.replace(root, remoteDirectory)
      manifest.push(new FileSpec(filepath, filename?true:false, remoteName));
      if (!filename) {
        manifest = manifest.concat(buildManifest(filepath, remoteDirectory, root));
      }
    }
  )
  return manifest;
}

ftp.connect(opts.ftp)
.then(function (serverMessage) {
  // Delete staging directory.
  console.log('Server message:', serverMessage);
  return ftp.rmdir(opts.domain + opts.stageDir, true);
}).catch(error => {
  // Ignore error if file doesn't exist.
  return new Promise((resolve, reject) => {
    /No such file or directory/.test(error.message)
      ? resolve('"' + opts.domain + opts.stageDir 
                + '" : Skip removal of staging directory. Does not exist.')
      : reject(error); 
  })
}).then(function (message) {
  // Create staging directory.
  console.log(message);
  return ftp.mkdir(opts.domain + opts.stageDir);
}).then(message => {
  // Build manifest.
  console.log(message);
  return buildManifest(opts.localDir, opts.domain + opts.stageDir);
}).then((manifest) => {
  // Upload files.
  return Promise.mapSeries(manifest, fileSpec => {
    console.log('  ->', fileSpec.path);
    return fileSpec.isFile 
        ? ftp.put(fileSpec.path, fileSpec.remotePath)
        : ftp.mkdir(fileSpec.remotePath)
    }
  );
}).then(() => {
  console.log('Upload complete.');
  return ftp.list(opts.domain);
}).then(list => {
  // Generate backup directory name.
  const item = list.reverse().find(it => /^html\.bak\.\d+$/.test(it.name));
  var nextIndex = item
    ? parseInt(item.name.match(/^html\.bak\.(\d+)$/)[1]) + 1
    : 1;
  return opts.domain + 'html.bak.' + nextIndex;
}).then(backupPath => {
  // Backup production html directory.
  console.log('Renaming', opts.domain + 'html/', 'to', backupPath);
  return ftp.rename(opts.domain + 'html/', backupPath)
}).then(message => {
  // Deploy stage directory.
  console.log(message);
  console.log('Renaming', opts.domain + opts.stageDir, 'to', opts.domain + 'html/');
  return ftp.rename(opts.domain + opts.stageDir, opts.domain + 'html/')
}).then(message => {
  // Log final message.
  console.log(message);
}).catch(error => {
  console.log(error);
}).finally(function (ignore) {
  console.log('Done!');
  return ftp.end();
});
