import { JSONSchema6 } from "json-schema";

export const RECIPE_IDS = {
  REDDIT_SEARCH: "5280469b-9f6d-413b-9d46-9955fdf3735a",
  REDDIT_SUBREDDIT: "183eea98-32c9-4cf6-8c03-6084147e30db",
};

export const FreeForkExamples = [
  {
    label: "Dog API",
    description: "Pictures of really cute dogs.",
    id: "cc37a0b6-e138-4e30-8dda-7fa28d4c0f65",
  },
  {
    label: "Reddit API",
    description: "Search across reddit!",
    id: "183eea98-32c9-4cf6-8c03-6084147e30db",
  },
  {
    label: "Pokemon API",
    description: "Pokedex as an API.",
    id: "c645327c-4652-4572-aa39-35388943abf8",
  },
  {
    label: "JSON Placeholder API",
    description: "Popular API for testing fake data.",
    id: "6bd53e59-8994-4382-ba41-d81146003b8d",
  },
];

export const SuggestedExamples = [
  {
    label: "OpenAI Chat Completion",
    description: "Figure out how to do generative AI with OpenAI's API.",
    id: "48f37734-bbf4-4d0e-81b4-08da77030b06",
  },
  {
    label: "NASA API",
    description: "See pictures from Mars Rover.",
    id: "a806fd1c-3325-4f07-bcdc-985f5033f80a",
    // tags: ["Free"],
  },
  {
    label: "Giphy API",
    description: "Memes as an API.",
    id: "ccfc1216-f4cc-4f64-b5c7-57bae974a4c4",
    // tags: ["Free"],
  },
  {
    label: "Unsplash API",
    description: "Gorgeous pictures for image backgrounds or covers.",
    id: "7e96b0cc-9684-4deb-8425-4f2ce98e9ae6",
    // tags: ["Free"],
  },
];

export const API_TYPE_NAMES = {
  APIRequestParams: "APIRequestParams",
  APIQueryParams: "APIQueryParams",
  APIUrlParams: "APIUrlParams",
};

const API_SAMPLE_REQUEST_BODY_TYPE = `
export interface APIRequestParams {
  model: "gpt-3.5-turbo" | "gpt-4" | "gpt-3";
  messages: {
    role: "system" | "user";
    content: string;
  }[];
}

// Define your request body with TypeScript.
// This will add auto-complete (CTRL+SPACE) and validation!
`.trim();

const API_SAMPLE_REQUEST_BODY_JSON = `
{
  "model": 100
}

// Sample request body params
// Hover over red markers to see type linting in action
`.trim();

const API_SAMPLE_REQUEST_BODY_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    color: {
      type: "string",
      enum: ["red", "blue", "green"],
    },
    counter: {
      type: "number",
    },
  },
  required: ["color", "counter"],
  additionalProperties: false,
};

const API_SAMPLE_QUERY_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    color: {
      type: "string",
      enum: ["red", "blue", "green"],
    },
    counter: {
      type: "number",
    },
  },
  required: ["color", "counter"],
  additionalProperties: false,
};

const API_SAMPLE_QUERY_PARAMS_TYPE = `
export interface APIQueryParams {
  color: "red" | "blue" | "green",
  counter: number,
}

// Define your query params with TypeScript.
// This will add auto-complete (CTRL+SPACE) and validation!
`.trim();

const API_SAMPLE_QUERY_JSON = `
{
  "color": 100 
}

// Sample query params
// Hover over red markers to see type linting in action

`.trim();

// const API_SAMPLE_URL_PARAMS_TYPE = {$schema: "http://json-schema.org/draft-07/schema#", type: "object", properties: Object, …}
// {$schema: "http://json-schema.org/draft-07/schema#", type: "object", properties: Object, required: ["color", "counter"], additionalProperties: false}Object
// `

const API_SAMPLE_URL_PARAMS_TYPE = `
export interface ${API_TYPE_NAMES.APIUrlParams} {
  // "{sort}": "asc" | "desc";
  // "{filter}": "top" | "new";
}

// Define your url params with TypeScript.
// This will add auto-complete (CTRL+SPACE) and validation!
`.trim();

const API_SAMPLE_URL_JSON = JSON.stringify(
  {
    "{sort}": "asc",
    "{filter}": "popular",
  },
  null,
  2
);

export const API_SAMPLES = {
  API_SAMPLE_REQUEST_BODY_TYPE: {
    TYPE: API_SAMPLE_REQUEST_BODY_TYPE,
    JSON: API_SAMPLE_REQUEST_BODY_JSON,
    SCHEMA: API_SAMPLE_REQUEST_BODY_SCHEMA as JSONSchema6,
  },
  API_SAMPLE_QUERY_PARAMS_TYPE: {
    TYPE: API_SAMPLE_QUERY_PARAMS_TYPE,
    JSON: API_SAMPLE_QUERY_JSON,
    SCHEMA: API_SAMPLE_QUERY_SCHEMA as JSONSchema6,
  },
  API_SAMPLE_URL_PARAMS_TYPE: {
    TYPE: API_SAMPLE_URL_PARAMS_TYPE,
    JSON: API_SAMPLE_URL_JSON,
    SCHEMA: API_SAMPLE_REQUEST_BODY_SCHEMA as JSONSchema6,
  },
};
