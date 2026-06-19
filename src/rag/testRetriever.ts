import "dotenv/config";

import { retrieveKnowledge }   from "./retriever";

async function main() {
  const results =
    await retrieveKnowledge(
      "animate derivative equation with graph",
      5
    );

  console.dir(
    results,
    { depth: null }
  );
}

main();