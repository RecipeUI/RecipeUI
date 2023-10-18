export const LATEST_APP_VERSION = "0.8.10";
export const LATEST_WEB_VERSION = "0.8.10";

export const VERSION_LOGS: {
  version: string;
  update: string;
  update_type?: "bug" | "feature";
  ignore?: boolean;
  type?: "minor" | "major" | "patch";
}[] = [
  {
    version: "0.8.10",
    update:
      "Improved importing for query and URL. Minor bug fixes and improvements.",
  },
  {
    version: "0.8.9",
    update:
      "Minor bug fixes and improvements. OAuth2 Client Credentials support.",
    update_type: "feature",
    type: "major",
  },
  {
    version: "0.8.8",
    update: "Drag folders/files in sidebar. Partial support for multi-form.",
    update_type: "feature",
    type: "major",
  },
  {
    version: "0.8.7",
    update: "Support for Basic Auth and Multiple query/header auth.",
    update_type: "feature",
    type: "major",
  },
  {
    version: "0.8.6",
    update: "Nested folders. Improved cloud syncing.",
    update_type: "feature",
    ignore: true,
  },
  {
    version: "0.8.5",
    update: "Bug fixes and multiple UX improvements. Auth flow improved.",
    update_type: "bug",
  },
  {
    version: "0.8.2",
    update: "Bug fixes. Migrate to API storybook (more details soon).",
    update_type: "bug",
    ignore: true,
  },
  {
    version: "0.8.0",
    update: "Ability to share and publish folders as collections!",
    update_type: "feature",
  },
  {
    version: "0.8.0",
    update: "Add headers to output response.",
    update_type: "feature",
  },
  {
    version: "0.7.7",
    update: "Request history. Preview, replay, and save past request runs!",
    update_type: "feature",
  },
  {
    version: "0.7.6",
    update: "Save requests as recipes that you can replay quickly.",
    update_type: "feature",
  },
];

export const hasMajorUpdate = VERSION_LOGS[0].type === "major";
