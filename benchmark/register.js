const autocannon = require("autocannon");

const usersData = require("./users.json");

function startBench() {
    const url = "http://iwomm.cse356.compas.cs.stonybrook.edu";

  const args = process.argv.slice(2);
  const numConnections = args[0] || 1000;
  const maxConnectionRequests = args[1] || 1000;

  let requestNumber = 0;

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
          method: "POST",
          path: "/users/signup",
          setupRequest: function (request) {
            console.log("Request Number: ", requestNumber + 1);

            request.body = JSON.stringify(usersData[requestNumber]);

            requestNumber++;

            return request;
          },
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