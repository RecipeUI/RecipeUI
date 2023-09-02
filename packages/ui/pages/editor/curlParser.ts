import { parse } from "json5";

function getParts(curlString: string): string[] {
  const _parts = curlString
    .split(/\\\n|\n/)
    .join("")
    .split(" ")
    .filter((p) => p !== "");

  let parsedParts: string[] = [];
  let builder: string[] = [];
  let buildingWith: string | null = null;

  for (let part of _parts) {
    if (buildingWith !== null) {
      if (part.endsWith(buildingWith)) {
        builder.push(part);

        parsedParts.push(builder.join(" "));
        builder = [];
        buildingWith = null;
      } else {
        builder.push(part);
      }
    } else {
      if (part.startsWith(`"`) || part.startsWith(`'`)) {
        buildingWith = part[0];
        builder.push(part);
      } else {
        parsedParts.push(part);
      }
    }
  }
  return parsedParts;
}

export interface CurlRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}

function parsePartsToCurl(parts: string[]) {
  let result: CurlRequestInfo = {
    method: "GET", // Default method
    url: "",
    headers: {},
    body: null,
  };

  for (let i = 0; i < parts.length; i++) {
    switch (parts[i].toLowerCase()) {
      case "curl":
        // Skip the curl keyword itself.
        break;
      case "-x":
        result.method = parts[i + 1];
        i++; // Skip the next item which is the actual method.
        break;
      case "-h":
      case "--header":
        const str = parts[i + 1];
        const index = str.indexOf(":");

        const headerParts = [
          str.substring(0, index).trim(),
          str.substring(index + 1).trim(),
        ];

        const [header, key] = headerParts;
        result.headers[header.slice(1)] = key.slice(0, -1);
        i++; // Skip the next item which is the actual header.
        break;
      case "-d":
      case "--data":
        try {
          result.body = parse(parse(parts[i + 1]));
        } catch (e) {
          console.error("Unable to parse body", parts[i + 1]);
        }
        i++; // Skip the next item which is the actual body.
        break;
      default:
        // Assume this is the URL if it's not recognized as a flag or flag value.
        if (!result.url && !parts[i].startsWith("-")) {
          result.url = parts[i];
        }
        break;
    }
  }

  return result;
}

export function parseCurl(curlString: string): CurlRequestInfo {
  const parts = getParts(curlString);
  const result = parsePartsToCurl(parts);
  return result;
}
