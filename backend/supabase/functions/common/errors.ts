import { corsHeaders } from "./cors.ts";

export class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message);
  }
}

export class UserError extends ApplicationError {}

export const handleError = (err: unknown) => {
  if (err instanceof UserError) {
    console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    return new Response(JSON.stringify({ error: err.message, data: err.data }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } else if (err instanceof ApplicationError) {
    console.error(`${err.message}: ${JSON.stringify(err.data)}`);
  } else {
    console.error(err);
  }
  return new Response(JSON.stringify({ error: "There was an error processing your request" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};
