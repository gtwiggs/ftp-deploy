/**
 * Deploys a static site using FTP.
 * Existing site will be moved to a backup directory.
 */

// Requires Dev dependencies:
//  npm install file-system
//  npm install promise-ftp
//  npm install bluebird
//  npm install minimalist

var Promise = require("bluebird");
var fileSystem = require("file-system");
var PromiseFtp = require("promise-ftp");

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

module.exports = {
  ftp: new PromiseFtp(),

  /**
   * Builds a manifest of file specifications for static site.
   * @param {string} path full or relative pathname of the static site directory.
   * @param {string} remoteDirectory full pathname on remote server.
   */
  buildManifest: function(path, remoteDirectory, root = path) {
    var manifest = [];
    fileSystem.recurseSync(path, ["[^.]*.*"], function(
      filepath,
      relative,
      filename
    ) {
      const remoteName = filepath.replace(root, remoteDirectory);
      manifest.push(
        new FileSpec(filepath, filename ? true : false, remoteName)
      );
      if (!filename) {
        manifest = manifest.concat(
          buildManifest(filepath, remoteDirectory, root)
        );
      }
    });
    return manifest;
  },

  deploy: function(opts) {
    // Locally scoped version for access in promise chain.
    var ftp = this.ftp;

    return ftp
      .connect(opts.ftp)
      .then(function(serverMessage) {
        // Delete staging directory.
        console.log("Server message:", serverMessage);
        return ftp.rmdir(opts.domain + opts.stageDir, true);
      })
      .catch(error => {
        // Ignore error if file doesn't exist.
        return new Promise((resolve, reject) => {
          /No such file or directory/.test(error.message)
            ? resolve(
                '"' +
                  opts.domain +
                  opts.stageDir +
                  '" : Skip removal of staging directory. Does not exist.'
              )
            : reject(error);
        });
      })
      .then(function(message) {
        // Create staging directory.
        console.log(message);
        return ftp.mkdir(opts.domain + opts.stageDir);
      })
      .then(message => {
        // Build manifest.
        console.log(message);
        return this.buildManifest(opts.localDir, opts.domain + opts.stageDir);
      })
      .then(manifest => {
        // Upload files.
        return Promise.mapSeries(manifest, fileSpec => {
          console.log("  ->", fileSpec.path);
          return fileSpec.isFile
            ? ftp.put(fileSpec.path, fileSpec.remotePath)
            : ftp.mkdir(fileSpec.remotePath);
        });
      })
      .then(() => {
        console.log("Upload complete.");
        return ftp.list(opts.domain);
      })
      .then(list => {
        // Generate backup directory name.
        const item = list
          .reverse()
          .find(it => /^html\.bak\.\d+$/.test(it.name));
        var nextIndex = item
          ? parseInt(item.name.match(/^html\.bak\.(\d+)$/)[1]) + 1
          : 1;
        return opts.domain + "html.bak." + nextIndex;
      })
      .then(backupPath => {
        // Backup production html directory.
        console.log("Renaming", opts.domain + "html/", "to", backupPath);
        return this.ftp.rename(opts.domain + "html/", backupPath);
      })
      .then(message => {
        // Deploy stage directory.
        console.log(message);
        console.log(
          "Renaming",
          opts.domain + opts.stageDir,
          "to",
          opts.domain + "html/"
        );
        return this.ftp.rename(opts.domain + opts.stageDir, opts.domain + "html/");
      })
      .then(message => {
        // Log final message.
        console.log(message);
      })
      .catch(error => {
        console.log("Deploy faled:", error);
      })
      .finally(function(ignore) {
        if (ftp.getConnectionStatus() === PromiseFtp.STATUSES.CONNECTED) {
          return ftp.end();
        }
        console.log("Done!");
      }).return;
  },

  ensureTrailingSlash: function(str) {
    return str.match(/\/$/) ? str : str + "/";
  },

  ftpDeploy: function(argv) {
    var rawOpts = require("minimist")(argv);

    if (!("domain" in rawOpts)) {
      throw new Error("`domain` not provided.");
    }
    if (!("host" in rawOpts)) {
      throw new Error("`host` not provided.");
    }
    if (!("user" in rawOpts)) {
      throw new Error("`user` not provided.");
    }
    if (!("pw" in rawOpts)) {
      throw new Error("`pw` not provided.");
    }

    var opts = {
      domain: this.ensureTrailingSlash(rawOpts.domain),
      stageDir: this.ensureTrailingSlash(rawOpts.stage || "html.stage/"),
      localDir: this.ensureTrailingSlash(rawOpts.local || "public/"),
      ftp: {
        host: rawOpts.host,
        user: rawOpts.user,
        password: rawOpts.pw
      }
    };

    console.log(" ");
    console.log(`Deploying ${opts.localDir}`);
    console.log(
      `       to ${opts.ftp.user}@${opts.ftp.host}/${opts.domain}${
        opts.stageDir
      }`
    );
    console.log(`...`);

    return this.deploy(opts);
  }
};

module.ftpDeploy(process.argv.slice(2))
