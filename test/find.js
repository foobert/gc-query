/* eslint-env mocha */
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const mongodb = require("mongo-mock");
chai.use(sinonChai);

const find = require("../lib/find");

describe("find", () => {
  let db;
  let gcs;
  before(async () => {
    mongodb.max_delay = 1;
    const MongoClient = mongodb.MongoClient;
    db = await MongoClient.connect("mongodb://localhost:27017/unittest", {});
    gcs = db.collection("gcs");
  });

  beforeEach(async () => {
    await gcs.deleteMany({});
  });

  after(() => {
    db.close();
  });

  it("should find something", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false }
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false }
      }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001", "GC00002"]);
  });

  it("should filter non-parsed geocaches", async () => {
    await gcs.insertMany([{ _id: "GC00001", coord: {} }]);
    const result = await find(gcs, {}).toArray();
    expect(result).to.be.empty;
  });

  it("should filter non-coord geocaches", async () => {
    await gcs.insertMany([
      { _id: "GC00001", parsed: { premium: false, disabled: false } }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result).to.be.empty;
  });

  it("should filter premium geocaches", async () => {
    await gcs.insertMany([
      { _id: "GC00001", coord: {}, parsed: { premium: true, disabled: false } }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result).to.be.empty;
  });

  it("should filter disabled geocaches by default", async () => {
    await gcs.insertMany([
      { _id: "GC00001", coord: {}, parsed: { premium: false, disabled: true } }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result).to.be.empty;
  });

  it("should not filter disabled geocaches", async () => {
    await gcs.insertMany([
      { _id: "GC00001", coord: {}, parsed: { premium: false, disabled: true } }
    ]);
    const result = await find(gcs, { disabled: true }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should filter disabled geocaches", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: true }
      }
    ]);
    const result = await find(gcs, { disabled: false }).toArray();
    expect(result).to.be.empty;
  });

  it("should not filter type by default", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, type: "foo" }
      }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should filter by type", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, type: "foo" }
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false, type: "bar" }
      }
    ]);
    const result = await find(gcs, { type: "foo" }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should not filter score by default", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, foundScore: 0 }
      }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should filter by score", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, foundScore: 0.5 }
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false, foundScore: 1 }
      }
    ]);
    const result = await find(gcs, { score: 0.6 }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00002"]);
  });

  it("should not filter exclude by default", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, owner: "foo" },
        foundBy: ["foo", "bar"]
      }
    ]);
    const result = await find(gcs, {}).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should filter by found", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false },
        foundBy: ["foo"]
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false },
        foundBy: ["foo", "bar"]
      },
      {
        _id: "GC00003",
        coord: {},
        parsed: { premium: false, disabled: false },
        foundBy: ["baz"]
      }
    ]);
    const result = await find(gcs, { exclude: "foo" }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00003"]);
  });

  it("should filter by multiple found", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false },
        foundBy: ["foo"]
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false },
        foundBy: ["foo", "bar"]
      },
      {
        _id: "GC00003",
        coord: {},
        parsed: { premium: false, disabled: false },
        foundBy: ["baz"]
      }
    ]);
    const result = await find(gcs, { exclude: ["bar", "baz"] }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should filter by owner", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, owner: "foo" }
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false, owner: "bar" }
      },
      {
        _id: "GC00003",
        coord: {},
        parsed: { premium: false, disabled: false }
      }
    ]);
    const result = await find(gcs, { exclude: "foo" }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00002", "GC00003"]);
  });

  it("should filter by multiple owners", async () => {
    await gcs.insertMany([
      {
        _id: "GC00001",
        coord: {},
        parsed: { premium: false, disabled: false, owner: "foo" }
      },
      {
        _id: "GC00002",
        coord: {},
        parsed: { premium: false, disabled: false, owner: "bar" }
      },
      {
        _id: "GC00003",
        coord: {},
        parsed: { premium: false, disabled: false, owner: "baz" }
      }
    ]);
    const result = await find(gcs, { exclude: ["foo", "bar"] }).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00003"]);
  });

  it("should not filter by bounding box by default", async () => {
    await gcs.insertMany([
      { _id: "GC00001", coord: {}, parsed: { premium: false, disabled: false } }
    ]);

    const result = await find(gcs, {}).toArray();
    expect(result.map(r => r._id)).to.deep.equal(["GC00001"]);
  });

  it("should filter by bounding box", async () => {
    // mongo-mock doesn't support geoWithin right now, so we have to hard code
    // the expected query
    const gcs = {
      find: sinon.stub()
    };

    await find(gcs, { bbox: [4, 4, 6, 6] });

    const coordFilter = gcs.find.getCall(0).args[0].coord;
    expect(coordFilter).to.deep.equal({
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [[[4, 6], [6, 6], [6, 4], [4, 4], [4, 6]]]
        }
      }
    });
  });
});
