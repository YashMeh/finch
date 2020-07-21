const NATS = require("nats");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);
const app = require("../worker");

describe("nats", () => {
  it("should not connect to the nats service", (done) => {
    let nc = NATS.connect("sda", { json: true });
    nc.on("error", (err) => {
      expect(err).to.be.a("object");
      done();
    });
  });
  it("should connect to the nats service", (done) => {
    let nc = NATS.connect(process.env.NATS_URL, { json: true });
    nc.on("connect", (res) => {
      expect(res).to.be.a("object");
      done();
    });
  });
});
// it("responds with a json message", (done) => {
//   chai
//     .request(app)
//     .get("/api/v1")
//     .end((err, res) => {
//       res.should.have.status(200);
//       done();
//    });
//});
