import server from "../dist/server/server.js";

export default async function handler(request, context) {
  return server.fetch(request, {}, context);
}

export const config = {
  runtime: "edge",
};
