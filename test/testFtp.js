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
  var manifest = F.buildManifest("test/data", "remote");
  console.dir(manifest);
  t.same(
    manifest.length,
    3,
    `files found: ${manifest.map(it => it.path).join(", ")}`
  );
  manifest.forEach(fileSpec => {
    console.dir(fileSpec);
    t.assert(fileSpec["path"].startsWith("test/data"));
    t.assert(fileSpec["remotePath"].startsWith("remote"));
  });
  t.end();
});
