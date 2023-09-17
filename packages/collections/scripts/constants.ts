import path from "path";
const ROOT_DIR = path.join(process.cwd(), "../..");

export const PATHS = {
  CORE_COLLECTION: process.cwd() + "/build/core/collections.json",
  CORE_APIS: process.cwd() + "/build/core/apis.json",
  BUILD_CORE_DIR: process.cwd() + "/build/core",
  CORE_DIR: process.cwd() + "/core",
  ROOT_DIR: ROOT_DIR,
  WEB: ROOT_DIR + "/apps/web",
  WEB_PUBLIC_CORE: ROOT_DIR + "/apps/web/public/core",
};
