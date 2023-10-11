"use client";
import { getArrayPathIndex, isArrayPath } from "../utils/main";

import {
  AuthConfig,
  Recipe,
  RecipeOptions,
  RecipeOutputType,
  RecipeParameters,
  RecipeProject,
  RecipeSession,
  RecipeTemplate,
  RecipeTemplateFragment,
  RequestHeader,
  User,
} from "types/database";
export type { RecipeSession }; // Fix this in a later refactor

import { StateCreator, create } from "zustand";
import { createContext } from "react";
import { produce } from "immer";
import {
  ContentType,
  RecipeAuthType,
  RecipeMethod,
  RecipeMutationContentType,
} from "types/enums";
import { Session } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { JSONSchema6, JSONSchema6Definition } from "json-schema";
import {
  deleteSession,
  setConfigForSessionStore,
  setParametersForSessionStore,
} from "./apiSession";

interface RecipeSessionSlice {
  currentSession: RecipeSession | null;
  sessions: RecipeSession[];

  setSessions: (sessions: RecipeSession[]) => void;
  setCurrentSession: (
    session: RecipeSession | null,
    editorMode?: boolean
  ) => void;
  updateCurrentSessionMethod: (method: RecipeMethod) => void;
  updateSessionName: (session: RecipeSession, name: string) => void;

  closeSession: (session: RecipeSession) => RecipeSession | undefined;
  closeSessions: (sessionIds: string[]) => void;

  addEditorSession: (session?: RecipeSession) => RecipeSession;
}

export enum RecipeBodyRoute {
  Parameters = "Parameters",
  Templates = "Recipes",
  Config = "Config",

  // EDITOR Routes
  Body = "Body",
  Query = "Query",
  URL = "URL",
  Headers = "Headers",
  Auth = "Auth",
  Collection = "Collection",
}

export enum RecipeOutputTab {
  Output = "Output",
  Docs = "Docs",
  DocTwo = "Doc",
  Code = "Code",
  History = "History",
}

export const getEmptyParameters = (): RecipeParameters => ({
  requestBody: {},
  queryParams: {},
  urlParams: {},
});

export interface SessionOutput {
  id?: string;
  output: Record<string, unknown>;
  responseInfo?: {
    status: number;
    headers: Record<string, string>;
    duration: number;
  };
  type: RecipeOutputType;
  duration?: number;
  requestInfo?: RecipeRequestInfo;
  created_at?: string;
  contentType?: ContentType;
}

export interface RecipeRequestInfo {
  url: string;
  payload: {
    method: RecipeMethod;
    headers: Record<string, string>;
    body: Record<string, unknown> | FormData | undefined;
  };
  options: RecipeOptions;
}

interface RecipeOutputSlice {
  isSending: boolean;
  setIsSending: (isSending: boolean, outputTab?: RecipeOutputTab) => void;

  outputTab: RecipeOutputTab;
  setOutputTab: (tab: RecipeOutputTab) => void;

  loadingTemplate:
    | ((RecipeTemplate | RecipeTemplateFragment) & { speedFactor?: number })
    | null;
  setLoadingTemplate: (
    template:
      | ((RecipeTemplate | RecipeTemplateFragment) & { speedFactor?: number })
      | null
  ) => void;
}

export type EditorSliceValues = Pick<
  RecipeEditorSlice,
  | "editorMode"
  | "editorUrl"
  | "editorMethod"
  | "editorBody"
  | "editorQuery"
  | "editorHeaders"
  | "editorBodyType"
  | "editorBodySchemaType"
  | "editorQuerySchemaType"
  | "editorBodySchemaJSON"
  | "editorQuerySchemaJSON"
  | "editorAuthConfig"
  | "editorHeader"
  | "editorURLSchemaJSON"
  | "editorURLSchemaType"
  | "editorURLCode"
  | "editorProject"
  | "editorSessionOptions"
>;

export interface RecipeEditorSlice {
  editorHeader: {
    title: string;
    description: string;
  };
  setEditorHeader: (header: { title: string; description: string }) => void;

  editorMode: boolean;
  setEditorMode: (editorModeOn: boolean) => void;

  editorUrl: string;
  setEditorUrl: (url: string) => void;

  editorMethod: RecipeMethod;
  setEditorMethod: (editorMethod: RecipeMethod) => void;

  editorBody: string;
  setEditorBody: (editorBody: string) => void;

  editorQuery: string;
  setEditorQuery: (editorQuery: string) => void;

  editorHeaders: RequestHeader[];
  setEditorHeaders: (editorHeaders: RequestHeader[]) => void;

  editorBodyType: RecipeMutationContentType | null;
  setEditorBodyType: (editorBodyType: RecipeMutationContentType | null) => void;

  editorBodySchemaType: string | null;
  setEditorBodySchemaType: (editorBodySchemaType: string | null) => void;

  editorBodySchemaJSON: JSONSchema6 | null;
  setEditorBodySchemaJSON: (editorBodySchemaJson: JSONSchema6 | null) => void;
  updateEditorBodySchemaJSON: (props: {
    path: string;
    update: JSONSchema6;
    merge: boolean;
  }) => void;

  editorQuerySchemaType: string | null;
  setEditorQuerySchemaType: (editorQuerySchemaType: string | null) => void;

  editorQuerySchemaJSON: JSONSchema6 | null;
  setEditorQuerySchemaJSON: (editorQuerySchemaJSON: JSONSchema6 | null) => void;
  updateEditorQuerySchemaJSON: (props: {
    path: string;
    update: JSONSchema6;
    merge: boolean;
  }) => void;

  editorURLCode: string;
  setEditorURLCode: (editorURLCode: string) => void;

  editorURLSchemaType: string | null;
  setEditorURLSchemaType: (editorURLSchemaType: string | null) => void;

  editorURLSchemaJSON: JSONSchema6 | null;
  setEditorURLSchemaJSON: (editorURLSchemaJSON: JSONSchema6 | null) => void;
  updateEditorURLSchemaJSON: (props: {
    path: string;
    update: JSONSchema6;
    merge: boolean;
  }) => void;

  editorProject: string | null | undefined;
  setEditorProject: (editorProject: string | null) => void;

  editorSessionOptions: RecipeOptions | undefined;
  updateEditorSessionOptions: (editorSessionOptions?: RecipeOptions) => void;

  initializeEditorSession: (
    editorSession: Partial<
      EditorSliceValues & {
        currentSession: RecipeSession;
        outputTab?: RecipeOutputTab;
      }
    >
  ) => void;

  editorAuthConfig: AuthConfig | null;
  setEditorAuthConfig: (editorAuthConfig: AuthConfig | null) => void;

  saveEditorSession: () => Promise<void>;
}

// Destination is the final schema that's correct
// Source is the schema that might have old docs
// This is also hilariously a leetcode symmetrical tree problem
function mergePreserveDocs({
  destination,
  source,
}: {
  destination: JSONSchema6 | null;
  source: JSONSchema6 | null;
}) {
  if (!destination) return null;
  if (!source) return destination;

  function isSchema(item: JSONSchema6Definition): item is JSONSchema6 {
    return typeof item !== "boolean";
  }

  return produce(destination, (draft) => {
    function recur(d: JSONSchema6, s: JSONSchema6) {
      if (s.description) d.description = s.description;
      if (s.minimum) d.minimum = s.minimum;
      if (s.maximum) d.maximum = s.maximum;
      if (s.default) d.default = s.default;

      if (d.items && s.items) {
        if (Array.isArray(d.items) && Array.isArray(s.items)) {
          for (let i = 0; i < d.items.length; i++) {
            const dItem = d.items[i];
            const sItem = s.items[i];

            if (isSchema(dItem) && isSchema(sItem)) {
              recur(dItem, sItem);
            }
          }
        }
      }

      if (d.properties && s.properties) {
        Object.keys(d.properties).forEach((key) => {
          let dDefinition = d.properties?.[key];
          let sDefinition = s.properties?.[key];

          if (
            dDefinition &&
            sDefinition &&
            isSchema(dDefinition) &&
            isSchema(sDefinition)
          ) {
            recur(dDefinition, sDefinition);
          }
        });
      }

      if (d.definitions && s.definitions) {
        Object.keys(d.definitions).forEach((key) => {
          let dDefinition = d.definitions?.[key];
          let sDefinition = s.definitions?.[key];

          if (
            dDefinition &&
            sDefinition &&
            isSchema(dDefinition) &&
            isSchema(sDefinition)
          ) {
            recur(dDefinition, sDefinition);
          }
        });
      }
    }

    recur(draft, source);
  });
}

function getContentTypeHeader() {
  return {
    name: "Content-Type",
    value: "application/json",
  };
}

async function savePrevSessionPre(prevState: Slices) {
  const currentSession = prevState.currentSession;
  if (!currentSession) return;

  const { id: currentSessionId, recipeId: currentRecipeId } = currentSession;
  const {
    editorBody,
    editorQuery,
    editorHeaders,

    editorUrl,
    editorMethod,
    editorBodyType,
    editorBodySchemaType,
    editorBodySchemaJSON,
    editorQuerySchemaType,
    editorQuerySchemaJSON,
    editorAuthConfig,
    editorHeader,
    editorURLSchemaJSON,
    editorURLSchemaType,
    editorURLCode,
    editorProject,
    editorSessionOptions,
  } = prevState;

  await setParametersForSessionStore({
    session: currentSessionId,
    parameters: {
      editorBody,
      editorQuery,
      editorHeaders,
      editorURLCode,
    },
  });

  await setConfigForSessionStore({
    recipeId: currentRecipeId,
    config: {
      editorUrl,
      editorMethod,
      editorBodyType,
      editorBodySchemaType,
      editorBodySchemaJSON,
      editorQuerySchemaType,
      editorQuerySchemaJSON,
      editorAuthConfig,
      editorHeader,
      editorURLSchemaJSON,
      editorURLSchemaType,
      editorProject,
      editorSessionOptions,
    },
  });
}

function resetEditorSlice(): EditorSliceValues {
  return {
    editorHeader: {
      title: "Title of API",
      description: "Describe this API",
    },
    editorMode: false,
    editorUrl: "",
    editorMethod: RecipeMethod.GET,
    editorBody: "",
    editorQuery: "",
    editorHeaders: [
      {
        ...getContentTypeHeader(),
      },
    ],
    editorBodyType: null,
    editorBodySchemaType: null,
    editorQuerySchemaType: null,
    editorBodySchemaJSON: null,
    editorQuerySchemaJSON: null,
    editorAuthConfig: null,

    editorURLSchemaType: null,
    editorURLSchemaJSON: null,
    editorURLCode: "",

    editorProject: undefined,
    editorSessionOptions: undefined,
  };
}

export const createRecipeEditorSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeEditorSlice
> = (set, get) => {
  return {
    ...resetEditorSlice(),
    initializeEditorSession: (editorSession) => {
      set((prevState) => {
        savePrevSessionPre(prevState);

        return {
          ...resetEditorSlice(),
          ...editorSession,
          ...(!prevState.sessions.some(
            (session) => session.id === editorSession.currentSession?.id
          )
            ? {
                sessions: [
                  ...prevState.sessions,
                  editorSession.currentSession!,
                ],
              }
            : {
                sessions: prevState.sessions.map((session) => {
                  if (session.id === editorSession.currentSession?.id) {
                    return editorSession.currentSession!;
                  }
                  return session;
                }),
              }),
          ...(!editorSession.editorBody && editorSession.editorBodyType
            ? { editorBody: "" }
            : null),
          ...(!editorSession.editorQuery && editorSession.editorQuerySchemaType
            ? { editorQuery: "" }
            : null),
          ...(!editorSession.editorURLCode && editorSession.editorURLSchemaType
            ? { editorURLCode: "" }
            : null),
          bodyRoute: RecipeBodyRoute.Body,
          outputTab: editorSession.outputTab ?? RecipeOutputTab.Output,
          requestInfo: null,
          desktopPage: {
            page: DesktopPage.Editor,
            pageParam: editorSession.currentSession?.id,
          },
          editorMode: true,
        };
      });
    },

    setEditorHeader(header) {
      set(() => ({ editorHeader: header }));
    },

    saveEditorSession: () => {
      return new Promise((resolve) => {
        set((prevState) => {
          savePrevSessionPre(prevState)
            .then(() => {
              resolve();
            })
            .finally(() => resolve());

          return {};
        });
      });
    },

    setEditorProject(editorProject) {
      set(() => ({ editorProject }));
    },
    setEditorMode: (editorModeOn) => set(() => ({ editorMode: editorModeOn })),
    setEditorUrl: (url) => set(() => ({ editorUrl: url })),
    setEditorMethod: (editorMethod: RecipeMethod) =>
      set(() => ({ editorMethod })),
    setEditorBody: (editorBody) => set(() => ({ editorBody })),
    setEditorQuery: (editorQuery) => set(() => ({ editorQuery })),
    setEditorHeaders: (editorHeaders) => set(() => ({ editorHeaders })),
    setEditorBodyType: (editorBodyType) => set(() => ({ editorBodyType })),
    setEditorBodySchemaType(editorBodySchemaType) {
      set(() => ({ editorBodySchemaType }));
    },
    setEditorQuerySchemaType(editorQuerySchemaType) {
      set(() => ({ editorQuerySchemaType }));
    },
    setEditorBodySchemaJSON(editorBodySchemaJson) {
      set((prevState) => ({
        editorBodySchemaJSON: mergePreserveDocs({
          destination: editorBodySchemaJson,
          source: prevState.editorBodySchemaJSON || {},
        }),
      }));
    },
    setEditorQuerySchemaJSON(editorQuerySchemaJSON) {
      set((prevState) => ({
        editorQuerySchemaJSON: mergePreserveDocs({
          destination: editorQuerySchemaJSON,
          source: prevState.editorQuerySchemaJSON || {},
        }),
      }));
    },

    updateEditorSessionOptions(editorSessionOptions) {
      set((prevState) => {
        return {
          editorSessionOptions: {
            ...prevState.editorSessionOptions,
            ...editorSessionOptions,
          },
        };
      });
    },
    updateEditorBodySchemaJSON({ path, update, merge = true }) {
      set((prevState) => {
        const nextState = produce(prevState.editorBodySchemaJSON, (draft) => {
          const paths = path.split(".");

          let destination = draft;

          try {
            for (let i = 0; i < paths.length - 1; i++) {
              const inner_path = paths[i];

              // @ts-ignore
              destination = destination[inner_path] || {};
            }

            const finalPath = paths[paths.length - 1];

            // @ts-ignore
            destination[finalPath] = merge
              ? // @ts-ignore
                { ...destination[finalPath], ...update }
              : update;
          } catch (e) {}
        });

        return { editorBodySchemaJSON: nextState };
      });
    },

    updateEditorQuerySchemaJSON({ path, update, merge = true }) {
      set((prevState) => {
        const nextState = produce(prevState.editorQuerySchemaJSON, (draft) => {
          const paths = path.split(".");

          let destination = draft;

          try {
            for (let i = 0; i < paths.length - 1; i++) {
              const inner_path = paths[i];

              // @ts-ignore
              destination = destination[inner_path] || {};
            }

            const finalPath = paths[paths.length - 1];

            // @ts-ignore
            destination[finalPath] = merge
              ? // @ts-ignore
                { ...destination[finalPath], ...update }
              : update;
          } catch (e) {}
        });

        return { editorQuerySchemaJSON: nextState };
      });
    },

    setEditorURLSchemaType(editorURLSchemaType) {
      set(() => ({ editorURLSchemaType }));
    },
    setEditorURLSchemaJSON(editorURLSchemaJSON) {
      set((prevState) => ({
        editorURLSchemaJSON: mergePreserveDocs({
          destination: editorURLSchemaJSON,
          source: prevState.editorURLSchemaJSON || {},
        }),
      }));
    },
    updateEditorURLSchemaJSON({ path, update, merge = true }) {
      set((prevState) => {
        const nextState = produce(prevState.editorURLSchemaJSON, (draft) => {
          const paths = path.split(".");

          let destination = draft;

          try {
            for (let i = 0; i < paths.length - 1; i++) {
              const inner_path = paths[i];

              // @ts-ignore
              destination = destination[inner_path] || {};
            }

            const finalPath = paths[paths.length - 1];

            // @ts-ignore
            destination[finalPath] = merge
              ? // @ts-ignore
                { ...destination[finalPath], ...update }
              : update;
          } catch (e) {}
        });

        return { editorURLSchemaJSON: nextState };
      });
    },

    setEditorAuthConfig(editorAuthConfig) {
      set(() => ({ editorAuthConfig }));
    },
    setEditorURLCode(editorURLCode) {
      set(() => ({ editorURLCode }));
    },
  };
};

interface RecipeBodySlice {
  bodyRoute: RecipeBodyRoute;
  setBodyRoute: (route: RecipeBodyRoute) => void;

  requestBody: Record<string, unknown>;
  setRequestBody: (requestBody: Record<string, unknown>) => void;
  updateRequestBody: (updateProps: { path: string; value: unknown }) => void;

  queryParams: Record<string, unknown>;
  setQueryParams: (queryParams: Record<string, unknown>) => void;
  updateQueryParams: (updateProps: { path: string; value: unknown }) => void;

  urlParams: Record<string, unknown>;
  setUrlParams: (urlParams: Record<string, unknown>) => void;
  updateUrlParams: (updateProps: { path: string; value: unknown }) => void;
}

interface FileManagerSlice {
  fileManager: Record<string, File>;
  updateFileManager: (path: string, file: File) => void;
  deleteFileManager: (path: string) => void;
}

export enum DesktopPage {
  Project = "Project",
  New = "New",
  RecipeView = "RecipeView",
  Editor = "Editor",
}

export type DesktopPageShape =
  | {
      page: DesktopPage.Project;
      pageParam: string;
    }
  | {
      page: DesktopPage.New;
    }
  | {
      page: DesktopPage.RecipeView;
      pageParam: string;
    }
  | {
      page: DesktopPage.Editor;
      pageParam?: string;
    }
  | null;
interface DesktopStateSlice {
  desktopPage: DesktopPageShape;
  setDesktopPage: (props: DesktopPageShape) => void;
}

type Slices = RecipeSessionSlice &
  RecipeBodySlice &
  RecipeOutputSlice &
  FileManagerSlice &
  UserSessionSlice &
  DesktopStateSlice &
  RecipeEditorSlice;

export const createDesktopSlice: StateCreator<
  Slices,
  [],
  [],
  DesktopStateSlice
> = (set) => {
  return {
    desktopPage: {
      page: DesktopPage.Editor,
    },
    setDesktopPage: (pageProps) =>
      set(() => ({
        desktopPage: pageProps,
      })),
  };
};

export type LocalStorageState = RecipeParameters;

const createRecipeSessionSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeSessionSlice
> = (set) => {
  return {
    currentSession: null,
    sessions: [],
    setSessions: (sessions) => set(() => ({ sessions })),

    // TODO: Need a more failsafe way of doing this....
    // IT IS IMPORTANT TO PRESERVE THE CURRENT SESSION REQUEST LOCALLY WHEN CHANGING SESSIONS
    setCurrentSession: (session, editorMode = true) =>
      set(() => {
        return {
          ...(editorMode ? getEmptyParameters() : getEmptyParameters()),
          currentSession: session,
          editorMode,
          bodyRoute: editorMode
            ? RecipeBodyRoute.Body
            : RecipeBodyRoute.Parameters,
          outputTab: editorMode
            ? RecipeOutputTab.DocTwo
            : RecipeOutputTab.Output,
          requestInfo: null,
          ...(session === null && !editorMode ? { desktopPage: null } : {}),
        };
      }),

    updateSessionName: (session, name) =>
      set((prevState) => {
        const sessions = prevState.sessions.map((s) => {
          if (s.id === session.id) {
            return {
              ...s,
              name,
            };
          }
          return s;
        });

        return {
          sessions,
        };
      }),

    updateCurrentSessionMethod(method) {
      set((prevState) => {
        if (!prevState.currentSession) return {};

        const sessions = prevState.sessions.map((s) => {
          if (s.id === prevState.currentSession?.id) {
            return {
              ...s,
              apiMethod: method,
            };
          }
          return s;
        });

        return {
          sessions,
        };
      });
    },

    addEditorSession(session?: RecipeSession) {
      const newId = uuidv4();
      const newSession: RecipeSession = session ?? {
        id: newId,
        name: "",
        apiMethod: RecipeMethod.GET,
        recipeId: newId,
      };

      set((prevState) => {
        return {
          ...getEmptyParameters(),
          ...resetEditorSlice(),
          bodyRoute: RecipeBodyRoute.Body,
          currentSession: newSession,
          sessions: [...prevState.sessions, newSession],
          outputTab: RecipeOutputTab.Output,
          requestInfo: null,
          desktopPage: {
            page: DesktopPage.Editor,
            pageParam: newSession.id,
          },
          editorMode: true,
        };
      });
      return newSession;
    },

    closeSessions: (sessionIds: string[]) => {
      set((prevState) => {
        const sessionsToDelete = prevState.sessions.filter((s) => {
          return sessionIds.includes(s.id);
        });

        for (const session of sessionsToDelete) {
          deleteSession({
            recipeId: session.recipeId,
            sessionId: session.id,
          });
        }

        return {
          ...resetEditorSlice(),
          ...getEmptyParameters(),
          currentSession: null,
          sessions: prevState.sessions.filter((s) => {
            return !sessionIds.includes(s.id);
          }),
        };
      });
    },

    closeSession: (session) => {
      let nextSessionReturn: RecipeSession | undefined;

      set((prevState) => {
        deleteSession({
          recipeId: session.recipeId,
          sessionId: session.id,
        });

        let nextSessionIndex = -1;
        const sessions = prevState.sessions.filter((s, i) => {
          if (s.id === session.id) {
            if (prevState.sessions[i - 1]) nextSessionIndex = i - 1;
            if (prevState.sessions[i + 1]) nextSessionIndex = i + 1;

            return false;
          }

          return true;
        });

        const nextSession = prevState.sessions[nextSessionIndex];

        nextSessionReturn = nextSession;

        return {
          ...resetEditorSlice(),
          ...getEmptyParameters(),
          currentSession: null,
          sessions,
        };
      });

      return nextSessionReturn;
    },
  };
};

const createRecipeBodySlice: StateCreator<Slices, [], [], RecipeBodySlice> = (
  set
) => {
  function updateDraftParams({
    path,
    value,
    draft,
  }: {
    path: string;
    value: unknown;
    draft: Record<string, unknown>;
  }) {
    const paths = path.split(".").slice(1);

    while (paths.length > 1) {
      const current = paths.shift()!;
      draft = (
        isArrayPath(current)
          ? draft[getArrayPathIndex(current)]
          : draft[current]
      ) as typeof draft;
    }

    const finalPath = paths[0];
    if (value === undefined) {
      delete draft[finalPath];
      return;
    } else {
      if (isArrayPath(finalPath)) {
        draft[getArrayPathIndex(finalPath)] = value;
      } else {
        draft[finalPath] = value;
      }
    }
  }

  return {
    bodyRoute: RecipeBodyRoute.Parameters,
    setBodyRoute: (route) => set(() => ({ bodyRoute: route })),

    requestBody: {},
    setRequestBody: (requestBody) => set(() => ({ requestBody })),
    updateRequestBody: ({ path, value }) =>
      set((prevState) => {
        const nextState = produce(prevState.requestBody, (draft) => {
          updateDraftParams({ path, value, draft });
        });

        return { requestBody: nextState };
      }),

    queryParams: {},
    setQueryParams: (queryParams) => set(() => ({ queryParams })),
    updateQueryParams: ({ path, value }) =>
      set((prevState) => {
        const nextState = produce(prevState.queryParams, (draft) => {
          updateDraftParams({ path, value, draft });
        });

        return { queryParams: nextState };
      }),

    urlParams: {},
    updateUrlParams: ({ path, value }) =>
      set((prevState) => {
        return {
          urlParams: {
            ...prevState.urlParams,
            [path]: value,
          },
        };
      }),
    setUrlParams: (urlParams) => set(() => ({ urlParams })),
  };
};

const createRecipeOutputSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeOutputSlice
> = (set, get) => {
  return {
    isSending: false,
    setIsSending: (isSending, outputTab) =>
      set(() => ({
        isSending,
        ...(outputTab ? { outputTab } : {}),
      })),

    outputTab: RecipeOutputTab.Output,
    setOutputTab: (tab) => set(() => ({ outputTab: tab })),

    loadingTemplate: null,
    setLoadingTemplate: (template) =>
      set(() => ({
        loadingTemplate: template,
        ...(template && {
          outputTab: RecipeOutputTab.Docs,
        }),
      })),
  };
};

const createFileManagerSlice: StateCreator<Slices, [], [], FileManagerSlice> = (
  set
) => {
  return {
    fileManager: {},
    updateFileManager: (path, file) =>
      set((prevState) => ({
        fileManager: {
          ...prevState.fileManager,
          [path]: file,
        },
      })),
    deleteFileManager: (path) =>
      set((prevState) => {
        const { [path]: _, ...nextFileManager } = prevState.fileManager;
        return { fileManager: nextFileManager };
      }),
  };
};

interface UserSessionSlice {
  userSession: Session | null;
  setUserSession: (userSession: Session | null) => void;

  user: User | null;
  onboarding: boolean;

  setUser: (user: User | null) => void;
  setOnboarding: (onboarding: boolean) => void;
}

const createUserSessionSlice: StateCreator<Slices, [], [], UserSessionSlice> = (
  set
) => {
  return {
    userSession: null,
    setUserSession: (userSession) => set(() => ({ userSession })),

    onboarding: false,
    user: null,

    setUser: (user) => set(() => ({ user })),
    setOnboarding: (onboarding) => set(() => ({ onboarding })),
  };
};

export const useRecipeSessionStore = create<Slices>()((...a) => ({
  ...createRecipeSessionSlice(...a),
  ...createRecipeBodySlice(...a),
  ...createRecipeOutputSlice(...a),
  ...createFileManagerSlice(...a),
  ...createUserSessionSlice(...a),
  ...createDesktopSlice(...a),
  ...createRecipeEditorSlice(...a),
}));

export const GLOBAL_POLLING_FACTOR = 5000;
export const SESSION_HYDRATION_KEY = "SESSION_HYDRATION_KEY";
export const RecipeContext = createContext<Recipe | null>(null);

export const RecipeProjectContext = createContext<RecipeProject | null>(null);

export interface FetchRequest {
  url: string;
  payload: {
    method: RecipeMethod;
    headers: Record<string, string>;
    body: string | FormData | undefined;
    body_type?: RecipeMutationContentType;
  };
}
export interface FetchResponse {
  output: string;
  status: number;
  contentType: string;
  headers: Record<string, string>;
}

export const RecipeNativeFetchContext = createContext<
  ((req: FetchRequest) => Promise<FetchResponse>) | null
>(null);
