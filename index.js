const debug = require("debug")("gc:rest:index");
const express = require("express");
const mongo = require("mongodb");
const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");

const { find } = require("./lib/find");
const gpx = require("./lib/gpx");
const graphql = require("./lib/graphql");

async function main() {
  const url = process.env["GC_DB_URI"] || "mongodb://localhost:27017";
  debug("Connecting to mongodb at %s", url);
  const client = await mongo.MongoClient.connect(url);
  const db = client.db("gc");
  const gcs = db.collection("gcs");

  const app = express();

  app.use(compression());
  app.use(cors());
  app.use(morgan("tiny"));

  app.get("/api/poi.gpx", async (req, res) => {
    let cursor;
    try {
      const cursor = find(gcs, req.query).maxTimeMS(10 * 60 * 1000);
      res.type("application/gpx+xml");
      await gpx(cursor, data => res.write(data));
      res.end("");
    } catch (err) {
      console.error(err);
      res.status(500).send("Something went wrong");
    } finally {
      if (cursor) cursor.close();
    }
  });

  app.use("/api/graphql", graphql(db));

  app.listen(8080);
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
