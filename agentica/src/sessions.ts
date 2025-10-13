import { Agentica, IAgenticaController, IAgenticaProps } from "@agentica/core";
import OpenAI from "openai";
import { Model } from "openai/resources/models";

const sessions = new Map<string, Agentica<"chatgpt">>();

export function setAgent(key: string, controller: IAgenticaController.IHttp<"chatgpt">) {
const agent = new Agentica({
      model: "chatgpt",
      vendor: {
        api: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY!,
        }),
        model: "gpt-4o-mini",
      },

      controllers: [controller],
    });

    sessions.set(key, agent);
}

export function getAgent(key: string) : Agentica<"chatgpt"> | null {
  if (!sessions.has(key)) {
    return null;
  }

  return sessions.get(key)!!;
}