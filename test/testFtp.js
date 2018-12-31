const F = require("../lib/ftp-deploy.js");
const PromiseFtp = require("promise-ftp");

const test = require("tape");
const sinon = require("sinon");

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
    "test/data/folder/nestedFolder/file.txt",
  ];

  t.plan(expectedFiles.length + 1);

  const manifest = F.buildManifest("test/data", "remote");

  console.dir(manifest);
  expectedFiles.forEach(name => {
    t.assert(
      manifest.find(fileSpec => {
        return fileSpec.path === name &&
          fileSpec["remotePath"].startsWith("remote");
      }),
      name
    );
  });

  t.same(
    manifest.length,
    expectedFiles.length,
    `files found: ${manifest.map(it => it.path).join("\n")}`
  );

  t.end();
});
