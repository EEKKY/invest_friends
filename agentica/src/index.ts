import typia from "typia";
import dotenv from "dotenv";
import { getAgent } from "./sessions";


dotenv.config();
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

const main = async () => {
  while (true) {
    const request = await rl.question("You: ");
    if (request === "exit") {
      break;
    }

    console.log(await getAgent("user1")!!.conversate(request));
  }

  rl.close();
};

main();
