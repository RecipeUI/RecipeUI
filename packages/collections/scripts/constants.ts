import path from "path";
const ROOT_DIR = path.join(process.cwd(), "../..");

export const PATHS = {
  CORE_COLLECTION: process.cwd() + "/build/core/collections.json",
  COMMUNITY_COLLECTION: process.cwd() + "/build/community/collections.json",

  BUILD_CORE_DIR: process.cwd() + "/build/core",
  BUILD_COMMUNITY_DIR: process.cwd() + "/build/community",

  CORE_APIS: process.cwd() + "/build/core/apis.json",
  COMMUNITY_APIS: process.cwd() + "/build/community/apis.json",

  COLLECTIONS_DIR: process.cwd(),
  ROOT_DIR: ROOT_DIR,
  WEB: ROOT_DIR + "/apps/web",
  WEB_PUBLIC_CORE: ROOT_DIR + "/apps/web/public/core",
  WEB_PUBLIC_COMMUNITY: ROOT_DIR + "/apps/web/public/community", // We gonna change this eventually
};
