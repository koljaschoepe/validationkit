import { main } from "./main.js";

main(process.argv.slice(2)).catch((err) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(2);
});
