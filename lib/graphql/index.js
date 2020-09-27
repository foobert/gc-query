const { ApolloServer, gql } = require("apollo-server-express");
const { merge } = require("lodash");

const components = [
  require("./geocache"),
  require("./geocachesCount"),
  require("./statistics")
];

const typeDefs = gql`
  type Query {
    # get selected geocaches
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

    # get count of selected geocaches
    geocachesCount(quadkey: String): Count

    # get statistics
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
