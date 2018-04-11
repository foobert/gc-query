const bodyParser = require("body-parser");
const { graphqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const { merge } = require("lodash");

const components = [require("./geocache"), require("./statistics")];

const typeDefs = `
  type Query {
    geocaches(bbox: [Float!], type: Type, exclude: [String], disabled: Boolean, score: Float): [Geocache],
    stats: Statistics
  }
`;

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, ...components.map(c => c.types)],
  resolvers: merge(...components.map(c => c.resolvers))
});

module.exports = db => {
  return [
    bodyParser.json(),
    graphqlExpress({
      schema,
      rootValue: db,
      context: { db, gcs: db.collection("gcs"), areas: db.collection("areas") }
    })
  ];
};
