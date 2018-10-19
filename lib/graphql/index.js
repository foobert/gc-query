const { ApolloServer, gql } = require("apollo-server-express");
const { merge } = require("lodash");

const components = [require("./geocache"), require("./statistics")];

const typeDefs = gql`
  type Query {
    geocaches(
      bbox: [Float!]
      type: Type
      exclude: [String]
      disabled: Boolean
      score: Float
      limit: Int
      after: String
      quadkey: String
    ): GeocachePage
    stats: Statistics
  }
`;

module.exports = db =>
  new ApolloServer({
    typeDefs: [typeDefs, ...components.map(c => c.types)],
    resolvers: merge(...components.map(c => c.resolvers)),
    rootValue: db,
    context: {
      db,
      gcs: db.collection("gcs"),
      areas: db.collection("areas"),
      users: db.collection("users")
    }
  });
