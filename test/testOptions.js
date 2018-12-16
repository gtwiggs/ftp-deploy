const F = require("../lib/ftp-deploy.js");
const test = require("tape");
const sinon = require("sinon");

/*
    These tests exercise the capabilities of argv parsing by using both forms:
    --property=value
    --property value
*/

test("domain not present", function(t) {
  t.throws(
    () => F.ftpDeploy(["--host=hi", "--user", "hi", "--pw=hi"]),
    /domain/
  );
  t.end();
});

test("host not present", function(t) {
  t.throws(
    () => F.ftpDeploy(["--domain", "hi", "--user=hi", "--pw=hi"]),
    /host/
  );
  t.end();
});

test("user not present", function(t) {
  t.throws(
    () => F.ftpDeploy(["--pw", "hi", "--domain=hi", "--host=hi"]),
    /user/
  );
  t.end();
});

test("password not present", function(t) {
  t.throws(
    () => F.ftpDeploy(["--user", "hi", "--host=hi", "--domain=hi"]),
    /pw/
  );
  t.end();
});

test("ensure trailing slash added", function(t) {
  t.same(F.ensureTrailingSlash("test"), "test/");
  t.end();
});

test("ensure trailing slash preserved", function(t) {
  t.same(F.ensureTrailingSlash("test/"), "test/");
  t.end();
});

test("required args parsed, optional args defaulted", function(t) {
  var stub = sinon.stub(F, "deploy");
  stub.returns(true);

  t.doesNotThrow(() =>
    F.ftpDeploy([
      "--user",
      "_user",
      "--host=_host",
      "--domain=_domain",
      "--pw=_pw"
    ])
  );

  sinon.assert.calledOnce(stub);
  sinon.assert.calledWith(stub, {
    domain: "_domain/",
    stageDir: "html.stage/",
    localDir: "public/",
    ftp: {
      host: "_host",
      user: "_user",
      password: "_pw"
    }
  });
  stub.restore();
  t.end();
});

test("all args parsed", function(t) {
  var stub = sinon.stub(F, "deploy");
  stub.returns(true);

  t.doesNotThrow(() =>
    F.ftpDeploy([
      "--stage=_stage",
      "--user",
      "_user",
      "--host=_host",
      "--domain=_domain",
      "--pw=_pw",
      "--local",
      "_local/"
    ])
  );

  sinon.assert.calledOnce(stub);
  sinon.assert.calledWith(stub, {
    domain: "_domain/",
    stageDir: "_stage/",
    localDir: "_local/",
    ftp: {
      host: "_host",
      user: "_user",
      password: "_pw"
    }
  });
  stub.restore();
  t.end();
});
