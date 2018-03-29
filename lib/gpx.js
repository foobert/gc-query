const debug = require("debug")("gc:rest:gpx");
const mongo = require("mongodb");
const xml2js = require("xml2js");

function code(doc) {
  return doc.gc.substr(2);
}

function name(doc) {
  return clean(doc.parsed.name);
}

function type(doc) {
  switch (doc.parsed.type) {
    case "Traditional Geocache":
      return "T";
    case "Multi-cache":
      return "M";
    case "EarthCache":
      return "E";
    // TODO letterbox
    // TODO wherigo
    default:
      return "?";
  }
}

function size(doc) {
  return doc.parsed.size[0].toUpperCase();
}

function skill(doc) {
  return `${doc.parsed.difficulty.toFixed(1)}/${doc.parsed.terrain.toFixed(1)}`;
}

function clean(str) {
  return str
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "ss")
    .replace(/ {2,}/g, " ")
    .replace(/[^a-zA-Z0-9;:?!,.-=_\/@$%*+()<> |\n]/g, "")
    .trim();
}

function hint(doc) {
  return clean(doc.parsed.hint || "");
}

function title(doc) {
  return `${code(doc)} ${size(doc)}${type(doc)} ${skill(doc)}`;
}

function description(doc) {
  const h = hint(doc);
  return `${code(doc)} ${name(doc)}${h.length > 0 ? "\n" : ""}${h}`.substr(
    0,
    100
  );
}

async function generate(cursor) {
  let output = [];

  output.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
  output.push(
    '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
  );
  output.push(
    'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"'
  );
  output.push('version="1.1" creator="cachecache">');

  const builder = new xml2js.Builder({
    headless: true,
    renderOpts: { pretty: false }
  });

  let total = 0;
  while (await cursor.hasNext()) {
    let doc = await cursor.next();
    try {
      total++;
      const line = builder.buildObject({
        wpt: {
          $: {
            lat: doc.coord.lat || doc.coord.coordinates[1],
            lon: doc.coord.lon || doc.coord.coordinates[0]
          },
          name: title(doc),
          desc: description(doc),
          cmt: description(doc),
          type: "Geocache"
        }
      });
      output.push(line);
    } catch (err) {
      console.log(err);
      debug("Unable to process %s: %o", doc._id, err);
    }
  }
  output.push("</gpx>");
  debug("Generated %d entries", total);
  return output.join("\n");
}

module.exports = generate;
