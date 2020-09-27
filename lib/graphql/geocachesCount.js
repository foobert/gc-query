const debug = require("debug")("gc:query:graphql:geocachesCount");
const { gql } = require("apollo-server-express");
const { geocachesCount } = require("../find");

const types = `
  type Count {
    value: Int
  }
`;

const resolvers = {
  Query: {
    geocachesCount: async (obj, args, { gcs }) => {
      const docsCount = await geocachesCount(gcs, args);
      debug("Resolved geocaches count: %d", docsCount);
      return { value: docsCount };
    }
  }
};

module.exports = { types, resolvers };
