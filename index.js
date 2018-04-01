const debug = require("debug")("gc:rest:index");
const express = require("express");
const mongo = require("mongodb");
const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const { graphiqlExpress } = require("apollo-server-express");

const find = require("./lib/find");
const gpx = require("./lib/gpx");
const graphql = require("./lib/graphql");

async function main() {
  const url = process.env["GC_DB_URI"] || "mongodb://localhost:27017";
  const client = await mongo.MongoClient.connect(url);
  const db = client.db("gc");
  const gcs = db.collection("gcs");

  const app = express();

  app.use(compression());
  app.use(cors());
  app.use(morgan("tiny"));

  app.get("/api/poi.gpx", async (req, res) => {
    const cursor = find(gcs, req.query);
    const result = await gpx(cursor);
    res.type("application/gpx+xml").send(result);
  });

  app.use("/graphql", graphql({ gcs }));
  app.use("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

  app.listen(8080);
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
