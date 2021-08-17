const w = require("ws");
const { createServer } = require("http");

let tally = [];

const server = createServer();
const ws = new w.Server({ port: 8080 });

const medalWeights = {
  gold: 3,
  silver: 2,
  bronze: 1,
};

const getCountryScore = (country) => {
  return (
    country.gold * medalWeights.gold +
    country.silver * medalWeights.silver +
    country.bronze * medalWeights.bronze
  );
};

const sortTally = (aTally) => {
  return aTally.sort((a, b) => getCountryScore(b) - getCountryScore(a));
};

ws.on("connection", (wss) => {
  wss.on("open", function open() {
    wss.send([]);
  });

  wss.on("message", function incoming(message) {
    message = JSON.parse(message);
    const countryIndex = tally.findIndex(
      ({ country }) => country === message.country
    );

    if (countryIndex === -1) {
      tally = [
        ...tally,
        {
          country: message.country,
          gold: message.medal === "gold" ? 1 : 0,
          silver: message.medal === "silver" ? 1 : 0,
          bronze: message.medal === "bronze" ? 1 : 0,
        },
      ];

      wss.send(JSON.stringify(sortTally(tally)));

      return;
    }

    tally = [
      ...tally.slice(0, countryIndex),
      {
        ...tally[countryIndex],
        [message.medal]: tally[countryIndex][message.medal] + 1,
      },
      tally.slice(countryIndex + 1),
    ];

    wss.send(JSON.stringify(sortTally(tally)));

    return;
  });
});
