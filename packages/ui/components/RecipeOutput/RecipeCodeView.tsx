import {
  RecipeContext,
  RecipeRequestInfo,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import CodeMirror, { BasicSetupOptions } from "@uiw/react-codemirror";
import { useDarkMode } from "usehooks-ts";
import { useContext, useEffect, useState } from "react";
import { Recipe } from "types/database";
import { RecipeParamType } from "types/enums";
import { useOutput } from "../../state/apiSession/OutputAPI";
import { JSONSchema6 } from "json-schema";
import { useClipboard } from "../../hooks/useIsTauri";

const codeMirrorSetup: BasicSetupOptions = {
  lineNumbers: true,
  highlightActiveLine: false,
  dropCursor: false,
};

enum CodeView {
  CURL = "cURL",
  JavaScriptFetch = "JavaScript - Fetch",
  JavaScriptAxios = "JavaScript - Axios",
  PythonHttpClient = "Python - http.client",
  PythonRequestLib = "Python - requests",
}
const CodeViews = Object.values(CodeView);

export function RecipeCodeView() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const {
    output: { requestInfo },
  } = useOutput(currentSession?.id);
  const { isDarkMode } = useDarkMode();
  const [codeView, setCodeView] = useState(CodeView.CURL);
  const [output, setOutput] = useState("Make a request first!");
  const selectedRecipe = useContext(RecipeContext)!;

  const hasFileBinary = false;

  const clipboard = useClipboard();
  useEffect(() => {
    if (!requestInfo) {
      return;
    }

    if (codeView === CodeView.JavaScriptFetch) {
      setOutput(getJavaScriptFetchCode(requestInfo));
    } else if (codeView === CodeView.CURL) {
      setOutput(getCurlCode(requestInfo));
    } else if (codeView === CodeView.JavaScriptAxios) {
      setOutput(getJavaScriptAxiosCode(requestInfo));
    } else if (codeView === CodeView.PythonHttpClient) {
      setOutput(getPythonHttpClient(requestInfo));
    } else if (codeView === CodeView.PythonRequestLib) {
      setOutput(getPythonRequestLibCode(requestInfo));
    }
  }, [codeView, requestInfo]);

  return (
    <div className="sm:absolute inset-0 px-4 py-8 overflow-y-auto right-pane-bg">
      <h1 className="text-xl font-bold mb-4 text-black dark:text-white">
        Code
      </h1>
      <div className="space-x-2 flex items-center mb-4">
        <select
          className="select select-bordered max-w-xs select-sm w-64 h-full bg-slate-700 text-white"
          value={codeView}
          onChange={(event) => {
            setCodeView(event.target.value as CodeView);
          }}
        >
          {CodeViews.map((view) => {
            return <option key={view}>{view}</option>;
          })}
        </select>
        <button
          onClick={async () => {
            await clipboard.writeText(output);
            alert("Copied to clipboard");
          }}
          className="px-4 py-2 rounded-md  text-white btn btn-sm  btn-accent h-full"
        >
          Copy
        </button>
      </div>
      {hasFileBinary && (
        <div className="alert alert-info my-4">
          Support for file code generation coming soon...
        </div>
      )}
      <CodeMirror
        className="h-full !outline-none border-none max-w-sm sm:max-w-none"
        value={output}
        basicSetup={codeMirrorSetup}
        readOnly={true}
        theme={isDarkMode ? "dark" : "light"}
        extensions={[]}
      />
    </div>
  );
}

function getJavaScriptFetchCode({
  url,
  payload,
  options: recipeOptions,
}: RecipeRequestInfo) {
  const { headers, method, body: _body } = payload;

  // TODO: Support files
  const methodString = `\tmethod: "${method}"`;
  const headersString = `headers: ${JSON.stringify(headers, null, 2)
    .split("\n")
    .join("\n\t")}`;

  let bodyString = "";
  if (_body) {
    if (typeof _body === "string") {
      bodyString = `body: "${_body}"`;
    } else if (_body instanceof FormData) {
      // TODO
    } else if (Object.keys(_body).length > 0) {
      bodyString = `body: JSON.stringify(${JSON.stringify(_body, null, 2)
        .split("\n")
        .join("\n\t")})`;
    }
  }

  const strings = [methodString, headersString, bodyString].filter(Boolean);

  const postJsonProcess =
    headers["Content-Type"] === "application/json"
      ? `\n\t.then((res) => res.json())\n\t.then((json) => console.log(json))`
      : "";

  const templateString = `
const options = {
${strings.join(",\n\t")}
};

fetch("${url.toString()}", options)${postJsonProcess};
  `.trim();

  return templateString;
}

function getJavaScriptAxiosCode({
  url,
  payload,
  options: recipeOptions,
}: RecipeRequestInfo) {
  const { headers, method, body: _body } = payload;

  // TODO: Support files
  const methodString = `method: "${method}"`;
  const urlString = `url: "${url.toString()}"`;
  const headersString = `headers: ${JSON.stringify(headers, null, 2)
    .split("\n")
    .join("\n\t")}`;

  let bodyString = "";
  if (_body) {
    if (typeof _body === "string") {
      bodyString = `body: "${_body}"`;
    } else if (_body instanceof FormData) {
      // TODO
    } else if (Object.keys(_body).length > 0) {
      bodyString = `data: ${JSON.stringify(_body, null, 2)
        .split("\n")
        .join("\n\t")}`;
    }
  }

  const strings = [methodString, urlString, headersString, bodyString].filter(
    Boolean
  );

  const postJsonProcess =
    headers["Content-Type"] === "application/json"
      ? `\n\t.then((res) => console.log(res.data))\n\t.catch((err) => console.error(err))`
      : "";

  const templateString = `
const axios = require('axios');

const options = {
\t${strings.join(",\n\t")}
};

axios.request(options)${postJsonProcess};
  `.trim();

  return templateString;
}

function getPythonHttpClient({
  url: _url,
  payload,
  options: recipeOptions,
}: RecipeRequestInfo) {
  const { headers, method, body: _body } = payload;

  const url = new URL(_url);
  const lines: string[] = [];
  lines.push(`import http.client`);
  lines.push(`import json`);
  lines.push("\n");

  lines.push(`conn = http.client.HTTPSConnection("${url.hostname}")`);
  lines.push(`headers = ${JSON.stringify(headers, null, 2)}`);

  let hasBody = false;
  if (_body) {
    if (typeof _body === "string") {
      hasBody = true;
      lines.push(`payload = "${_body}"`);
    } else if (_body instanceof FormData) {
      // TODO
    } else if (Object.keys(_body).length > 0) {
      hasBody = true;
      lines.push(`payload = json.dumps(${JSON.stringify(_body, null, 2)})`);
    }
  }

  lines.push("\n");

  if (hasBody) {
    lines.push(
      `conn.request("${method}", "${url.pathname}", body=payload, headers=headers)`
    );
  } else {
    lines.push(`conn.request("${method}", "${url.pathname}", headers=headers)`);
  }
  lines.push("\n");

  lines.push(`res = conn.getresponse()`);
  lines.push(`data = res.read()`);
  lines.push("\n");

  lines.push(`json_data = json.loads(data.decode("utf-8"))`);
  lines.push(`print(json_data)`);

  return lines.join("\n").replaceAll("\n\n", "\n");
}

function getPythonRequestLibCode({
  url,
  payload,
  options: recipeOptions,
}: RecipeRequestInfo) {
  const { headers, method, body: _body } = payload;

  const lines: string[] = [];
  lines.push(`import requests # pip install requests`);
  lines.push(`\n`);
  lines.push(`url = '${url.toString()}'`);
  lines.push(`method = '${method}'`);
  lines.push(`headers = ${JSON.stringify(headers, null, 2)}`);

  let hasBody = false;
  if (_body) {
    if (typeof _body === "string") {
      hasBody = true;
      lines.push(`payload = "${_body}"`);
    } else if (_body instanceof FormData) {
      // TODO
    } else if (Object.keys(_body).length > 0) {
      hasBody = true;
      lines.push(`payload = ${JSON.stringify(_body, null, 2)}`);
    }
  }

  lines.push("\n");
  if (hasBody) {
    lines.push(
      `response = requests.request(method, url, json=payload, headers=headers)`
    );
  } else {
    lines.push(`response = requests.request(method, url, headers=headers)`);
  }
  lines.push("\n");

  lines.push(`if response.status_code == 200:\n\tprint(response.json())`);
  lines.push(`else:\n\tprint('Failed to fetch data', response.text)`);

  return lines.join("\n").replaceAll("\n\n", "\n");
}

function getCurlCode({
  url,
  payload,
  options: recipeOptions,
}: RecipeRequestInfo) {
  const { headers, method, body } = payload;

  const lines = [`\t--url '${url.toString()}'`];

  if (headers) {
    for (const [headerName, headerValue] of Object.entries(headers)) {
      lines.push(`-H '${headerName}: ${headerValue}'`);
    }
  }

  if (body) {
    let headerContentType = headers["Content-Type"] || headers["content-type"];

    if (typeof body === "string") {
      lines.push(`-d '${body}'`);
    } else if (
      headerContentType.includes("form") &&
      !(body instanceof FormData)
    ) {
      const formFields = Object.keys(body);

      for (let i = 0; i < formFields.length; i++) {
        const fieldName = formFields[i];
        const fieldValue = body[fieldName];
        lines.push(`-F ${fieldName}=${fieldValue}`);
      }
    } else if (Object.keys(body).length > 0) {
      lines.push(
        `-d '${JSON.stringify(body, null, 2).split("\n").join("\n    ")}'`
      );
    }
  }

  const templateString = `
curl -X ${method} \\
${lines.join(" \\\n\t")}
  `.trim();

  return templateString;
}
