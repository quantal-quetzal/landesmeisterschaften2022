import { Handler, HandlerResponse } from "@netlify/functions";
import axios from "axios";

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

type Body = {
  payload: {
    number: Number;
    created_at: String;
    ordered_human_fields: { title: String; name: String; value: String }[];
    form_id: String;
    form_name: String; // shuttle
  };
};

const handler: Handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as Body;
    if (body.payload.form_name === "shuttle")
      return handleShuttleFormSubmission(body.payload);

    return {
      statusCode: 400,
      body: `Unknown form_name ${body.payload.form_name}`,
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: "internal server error",
    };
  }
};

const handleShuttleFormSubmission = async (
  payload: Body["payload"]
): Promise<HandlerResponse> => {
  const direction = payload.ordered_human_fields.find(
    (field) => field.name === "direction"
  )?.value;
  const name = payload.ordered_human_fields.find(
    (field) => field.name === "name"
  )?.value;
  const phone = payload.ordered_human_fields.find(
    (field) => field.name === "phone"
  )?.value;

  if (!direction || !name || !phone)
    throw new Error(JSON.stringify({ direction, name, phone }));

  const directionString =
    direction === "freibad" ? "vom See zum Freibad" : "vom Freibad zum See";
  const message = `${name} möchte einen Shuttle ${directionString}.`;

  const queryParams = new URLSearchParams();
  queryParams.append("token", PUSHOVER_TOKEN!);
  queryParams.append("user", PUSHOVER_USER!);
  queryParams.append("message", message);
  queryParams.append("title", "Shuttle angefragt");
  queryParams.append("url", `tel:${phone}`);
  queryParams.append("url_title", "Anrufen");

  await axios.post(
    `https://api.pushover.net/1/messages.json?${queryParams.toString()}`,
    {}
  );

  return {
    statusCode: 200,
  };
};

export { handler };
