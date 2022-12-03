const autocannon = require("autocannon");

const usersData = require("./users.json");

const userCredential = {
    email: "jason.zheng.1@stonybrook.edu",
    password: "jason1234"
}

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
          path: "/users/login",
          setupRequest: function (request) {
            request.body = JSON.stringify(userCredential);
            return request;
          },
          onResponse: function (status, body, context, header) {
            context.cookie = header['Set-Cookie']
          },
        }, 
        {
            method: "POST",
            path: "/collection/create",
            setupRequest: function (request, context) {

                request.body = JSON.stringify({
                    name: "Benchmark"
                })
                let cookie = [];
                if (context && context.cookie) {
                    cookie = context.cookie.map((i) => {
                        return i.split(";")[0]
                    })
                }
                request.header = {
                    'content-type': 'application/json',
                    "cookie": cookie.join("; ")
                }
                console.log(request.header)
                return request;
              }
          }
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