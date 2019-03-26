const debug = require("debug")("gc:query:metrics");
const metrics = require("datadog-metrics");

const apiKey = process.env["DATADOG_API_KEY"];
if (apiKey) {
  metrics.init({ host: "copper", prefix: "gc.query." });
} else {
  debug("Missing DATADOG_API_KEY in environment, won't publish metrics");
}

function increment(name, amount, tags) {
  if (apiKey) {
    metrics.increment(name, amount || 1, tags);
  } else {
    debug("increment %s %d", name, amount);
  }
}

function gauge(name, value, tags) {
  if (apiKey) {
    metrics.gauge(name, value, tags);
  } else {
    debug("gauge %s %d", name, value);
  }
}

function meassure(name, promise) {
  if (apiKey) {
    const start = process.hrtime.bigint();
    return promise.then(result => {
      const end = process.hrtime.bigint();
      const millis = Number((end - start) / 1000000);
      gauge(name, millis);
      return result;
    });
  } else {
    debug("meassure %s, %o", name, promise);
    return promise;
  }
}

function expressjs() {
  if (!apiKey) {
    return (req, res, next) => next();
  }
  return function(req, res, next) {
    if (!req._startTime) {
      req._startTime = new Date();
    }

    let end = res.end;
    res.end = function(chunk, encoding) {
      res.end = end;
      res.end(chunk, encoding);

      let tags = [];
      tags.push("method:" + req.method.toLowerCase());
      tags.push("path:" + req.baseUrl + req.path);

      tags.push("response_code:" + res.statusCode);
      increment("expressjs.response_code." + res.statusCode, 1, tags);
      increment("expressjs.response_code.all", 1, tags);

      metrics.histogram(
        "expressjs.response_time",
        new Date() - req._startTime,
        tags
      );
    };

    next();
  };
}

module.exports = { increment, gauge, meassure, expressjs };
