const F = require("../lib/ftp-deploy.js");
const PromiseFtp = require("promise-ftp");

const test = require("tape");
const sinon = require("sinon");

test("backupDirectoryName 1", function(t) {
  const fileList = new Array(
    { name: "another-file" },
    { name: "." },
    { name: ".." },
    { name: "html.bak.1" },
    { name: "html" }
  );

  t.same(F.backupDirectoryName(fileList), "html.bak.2");
  t.end();
});

test("backupDirectoryName 3", function(t) {
  const fileList = new Array(
    { name: "html.bak.2" },
    { name: "html" }
  );

  t.same(F.backupDirectoryName(fileList), "html.bak.3");
  t.end();
});

test("backupDirectoryName 3", function(t) {
  const fileList = new Array(
    { name: "html/bak.3" },
    { name: "html.bak.2" }
  );

  t.same(F.backupDirectoryName(fileList), "html.bak.3");
  t.end();
});

test("backupDirectoryName empty", function(t) {
  t.same(F.backupDirectoryName(new Array()), "html.bak.1");
  t.end();
});

test("backupDirectoryName 1 - 10", function(t) {
  const fileList = new Array(
    { name: "html.bak.8" },
    { name: "html.bak.2" },
    { name: "html.bak.3" },
    { name: "html.bak.4" },
    { name: "html.bak.5" },
    { name: "html.bak.6" },
    { name: "html.bak.10" },
    { name: "html.bak.1" },
    { name: "html.bak.9" },
    { name: "html.bak.7" }
  );

  t.same(F.backupDirectoryName(fileList), "html.bak.11");
  t.end();
});

test("connect with expected args, error during connection", function(t) {
  var connectStub = sinon.stub(F.ftp, "connect");
  connectStub.rejects("test error");

  t.doesNotThrow(() =>
    F.deploy({
      domain: "_domain/",
      stageDir: "_stage/",
      localDir: "_local/",
      ftp: {
        host: "_host",
        user: "_user",
        password: "_pw"
      }
    })
  );

  sinon.assert.calledOnce(connectStub);
  sinon.assert.calledWith(connectStub, {
    host: "_host",
    user: "_user",
    password: "_pw"
  });

  sinon.restore();

  t.end();
});

test.skip("ftp call flow", function(t) {
  sinon.stub(F.ftp, "connect").resolves("test server message");
  sinon
    .stub(PromiseFtp.prototype, "rmdir")
    .rejects(new Error("No such file or directory"));

  F.deploy({
    domain: "_domain/",
    stageDir: "_stage/",
    localDir: "_local/",
    ftp: {
      host: "_host",
      user: "_user",
      password: "_pw"
    }
  });

  sinon.restore();

  t.end();
});

// Fragile: depends on contents of test/data directory.
test("build manifest", function(t) {
  const expectedFiles = [
    "test/data/.htaccess",
    "test/data/folder",
    "test/data/folder/nestedFolder",
    "test/data/folder/nestedFolder/file.txt"
  ];
  const expectedRemote = "remote";

  t.plan((expectedFiles.length * 2) + 1);

  const manifest = F.buildManifest("test/data", expectedRemote);

  console.dir(manifest);
  expectedFiles.forEach((name, index) => {
    t.isEqual(manifest[index].path, name);
    t.assert(
      manifest[index].remotePath.startsWith(expectedRemote),
      `${manifest[index].remotePath} should start with ${expectedRemote}`
    );
  });

  t.same(
    manifest.length,
    expectedFiles.length,
    `files found: ${manifest.map(it => it.path).join("\n")}`
  );

  t.end();
});
