import { parse } from "json5";
import { AuthConfig } from "types/database";
import { RecipeAuthType, RecipeMethod } from "types/enums";

const QUOTE_CHARS = ["'", '"'];
function splitStringManual(_str: string) {
  const str = _str.trim();
  let words: string[] = [];
  let builder: string = "";
  let buildingString = false;

  let i = 0;

  function addWord() {
    if (buildingString) {
      buildingString = false;

      words.push(builder.trim().slice(1, -1));
      builder = "";
    } else {
      words.push(builder.trim());
      builder = "";
    }
  }

  while (i < str.length) {
    const char = str[i];
    if (char === " " || char === "\\") {
      if (!builder) {
        i++;
        continue;
      }

      const isStillBuildingString =
        buildingString && !QUOTE_CHARS.includes(builder[builder.length - 1]);

      if (isStillBuildingString) {
        builder += char;
        i++;
        continue;
      }

      addWord();
    } else if (QUOTE_CHARS.includes(char)) {
      buildingString = true;
      builder += char;
    } else {
      builder += char;
    }
    i++;
  }

  if (builder) {
    addWord();
  }

  return words.filter((word) => {
    if (word.startsWith("\\") || word.startsWith("\n")) {
      return false;
    }

    return true;
  });
}

export interface CurlRequestInfo {
  method: RecipeMethod;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  authConfig?: AuthConfig | null;
}

function parsePartsToCurl(parts: string[]) {
  let result: CurlRequestInfo = {
    method: RecipeMethod.GET, // Default method
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
      case "--request":
        result.method = parts[i + 1] as RecipeMethod;
        i++; // Skip the next item which is the actual method.
        break;
      case "-g":
      case "--get":
        result.method = RecipeMethod.GET;
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
        result.headers[header] = key;
        i++; // Skip the next item which is the actual header.

        if (header === "Authorization") {
          if (key.startsWith("Bearer ")) {
            result.authConfig = {
              type: RecipeAuthType.Bearer,
              payload: {
                name: "Authorization",
                default: key.split("Bearer ")[1],
              },
            };
          } else if (key.startsWith("Basic ")) {
            result.authConfig = {
              type: RecipeAuthType.Basic,
              payload: {
                name: "base64",
                default: key.split("Basic ")[1],
              },
            };
          } else {
            // TODO: Migrate this to multiple. There are cases where APIs use two headers
            result.authConfig = {
              type: RecipeAuthType.Header,
              payload: {
                name: "Authorization",
                default: key,
              },
            };
          }
        }

        break;
      case "-d":
      case "--data":
        result.method = RecipeMethod.POST;
        try {
          result.body = parse(parts[i + 1]);
        } catch (e) {
          console.error("Unable to parse body", parts[i + 1]);
          result.body = { [parts[i + 1]]: null };

          try {
            const regex = /"([^"]+)":\s*([^"{}\[\],\s]+)(?=[,\n}])/g;
            const correctedString = parts[i + 1].replace(
              regex,
              (match, p1, p2) => {
                return `"${p1}": "${p2}"`;
              }
            );
            result.body = parse(correctedString);
          } catch (e) {
            console.error("Unable to parse body again");
          }
        }
        i++; // Skip the next item which is the actual body.
        break;

      case "-f":
      case "--form":
        if (parts.at(-2) !== "-d") {
          result.method = RecipeMethod.POST;
          parts.push("-d");
          parts.push(JSON.stringify({}));
        }

        const lastObj = JSON.parse(parts.at(-1)!);
        const [field, value] = parts[i + 1].split("=");
        try {
          lastObj[field] = parse(value);
        } catch (error) {
          lastObj[field] = value;
        }
        parts[parts.length - 1] = JSON.stringify(lastObj);
        i++;
        break;

      // TODO: Add case for location
      case "--url":
      case "--location":
        result.url = parts[i + 1];
        i++; // Skip the next item which is the actual url.
        break;
      case "-d-":
        break;
      case "-u":
      case "--user":
        const [username, password] = parts[i + 1].split(":");
        result.authConfig = {
          type: RecipeAuthType.Basic,
          payload: {
            name: "base64",
            default: btoa(`${username}:${password}`),
          },
        };
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
  const parts = splitStringManual(curlString);
  const result = parsePartsToCurl(parts);
  return result;
}
