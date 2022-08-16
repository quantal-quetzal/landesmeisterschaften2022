import { Handler } from "@netlify/functions";

const handler: Handler = async (event, context) => {
  console.log("event", event);
  console.log("context", context);

  return { statusCode: 200 };
};

export { handler };
