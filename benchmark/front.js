const autocannon = require("autocannon");

function startBench() {
  const url = "http://iwomm.cse356.compas.cs.stonybrook.edu";

  const args = process.argv.slice(2);
  const numConnections = args[0] || 1000;
  const maxConnectionRequests = args[1] || 1000;

  const instance = autocannon(
    {
      url,
      connections: numConnections,
      duration: 10,
      maxConnectionRequests,
      latency: true,
      headers: {
        "content-type": "application/json",
      },
      requests: [
        {
          method: "GET",
          path: "/",
        },
      ],
    },
    finishedBench
  );

  autocannon.track(instance);

  function finishedBench(err, res) {
    console.log("Finished Bench", err, res);
  }
}

startBench();