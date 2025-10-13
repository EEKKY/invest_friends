import typia from "typia";
import dotenv from "dotenv";
import { getAgent, setAgent } from "./sessions";

dotenv.config();

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { assertHttpController } from "@agentica/core";

const rl = readline.createInterface({ input, output });

const main = async () => {
  const controller = assertHttpController({
      name: "shopping",
      model: "chatgpt",
      document: await fetch(
        process.env.BACKEND_API_URL!,
      ).then(r => r.json()),
      connection: {
        host: process.env.BACKEND_API_URL!,
        headers: { Authorization: "Bearer ********" },
      },
    });
  while (true) {
    const request = await rl.question("You: ");
    if (request === "exit") {
      break;
    }

    const response = await getAgent("user1");
    if (response == null) {
      setAgent("user1", controller);
      getAgent("user1")!!.conversate(request);
    }
    else{
      response.conversate(request);
    }
  }

  rl.close();
};

main();
