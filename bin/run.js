#!/usr/bin/env node

const F = require("../lib/ftp-deploy.js");

F.ftpDeploy(process.argv.slice(2));
