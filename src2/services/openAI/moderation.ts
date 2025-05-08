import openai from "./client";

import { encoding_for_model } from "@dqbd/tiktoken";

const enc = encoding_for_model("gpt-3.5-turbo");
const MAX_TOKENS = 1800;

export async function moderateText(input: string) {
  const response = await openai.moderations.create({
    input,
  });
  return response.results[0]; // includes flagged, categories, and scores
}

export async function moderateMany(inputs: string[]) {
  const response = await openai.moderations.create({
    input: inputs,
  });
  return response.results; // array of results matching input order
}

/**
 * Splits inputs into batches under MAX_TOKENS tokens, calls moderateMany for each batch,
 * and returns all results as a flat array in the original input order.
 */
import {sleep} from '../../utils/async'
export async function moderateManySafe(inputs: string[], sleepBetweenMs:number = 0) {
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentTokenCount = 0;

  for (const input of inputs) {
    const tokens = enc.encode(input).length;

    if (tokens > MAX_TOKENS) {
      console.warn("Skipping overly long input:", input.slice(0, 100));
      continue;
    }

    if (currentTokenCount + tokens > MAX_TOKENS || currentBatch.length ==32) {
      batches.push(currentBatch);
      currentBatch = [input];
      currentTokenCount = tokens;
    } else {
      currentBatch.push(input);
      currentTokenCount += tokens;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  const results = [];
  for (const batch of batches){
    results.push(...await moderateMany(batch))
    console.log("mod sent")
    if(sleepBetweenMs > 0) await sleep(sleepBetweenMs)
  }
  return results.flat();
}