const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);
const app = require("../worker");

describe("app", () => {
  it("responds with a not found message", (done) => {
    chai
      .request(app)
      .get("/random-route")
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
  it("responds with a json message", (done) => {
    chai
      .request(app)
      .get("/api/v1")
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});
