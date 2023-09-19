import { useContext, useEffect } from "react";
import {
  PLAYGROUND_SESSION_ID,
  UNIQUE_ELEMENT_IDS,
} from "../../../utils/constants/main";
import {
  RecipeBodyRoute,
  RecipeContext,
  RecipeOutputTab,
  RecipeRequestInfo,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeOutputType } from "types/database";
import { RecipeParamType } from "types/enums";
import { JSONSchema6 } from "json-schema";
import { OutputAPI, useOutput } from "../../../state/apiSession/OutputAPI";

function getTime(t: number) {
  return t * 100;
}

export function useLoadingTemplate() {
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const session = useRecipeSessionStore((state) => state.currentSession)!;

  const setIsSending = useRecipeSessionStore((state) => state.setIsSending);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const setOutputTab = useRecipeSessionStore((state) => state.setOutputTab);

  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);

  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );
  const updateQueryParams = useRecipeSessionStore(
    (state) => state.updateQueryParams
  );
  const updateUrlParams = useRecipeSessionStore(
    (state) => state.updateUrlParams
  );

  const selectedRecipe = useContext(RecipeContext)!;

  useEffect(() => {
    if (!loadingTemplate) return;

    const { replay, requestBody, queryParams, urlParams } = loadingTemplate;
    if (replay?.duration) {
      let replayCap = replay.streaming ? 10000 : 5000;

      replay.duration = Math.min(replay.duration, replayCap);
    }

    let t = 0;

    function updateMagic({
      paramName,
      paramValue,
      paramSchema,
      updateFunction,
      path,
      speedFactor = loadingTemplate?.speedFactor ?? 1,
    }: {
      paramName: string;
      paramValue: unknown;
      paramSchema: JSONSchema6;

      path: string;
      updateFunction:
        | typeof updateRequestBody
        | typeof updateQueryParams
        | typeof updateUrlParams;

      speedFactor: number;
    }) {
      t += 12.5;

      if (!paramSchema) {
        return;
      }

      if (
        paramSchema.type === RecipeParamType.Array &&
        Array.isArray(paramValue)
      ) {
        setTimeout(() => {
          updateFunction({
            path: path + paramName,
            value: [],
          });
        }, getTime(t));
        t += 5 * speedFactor;

        for (let k = 0; k < paramValue.length; k++) {
          const item = paramValue[k];
          setTimeout(() => {
            updateFunction({
              path: path + paramName + `.[${k}]`,
              value: item,
            });
          }, getTime(t));
          t += 5 * speedFactor;
        }
      } else if (paramSchema.type === RecipeParamType.String) {
        if (
          paramSchema.type === RecipeParamType.String &&
          typeof paramValue === "string"
        ) {
          // This is literally overkill but makes it look really cool!
          if (paramSchema.enum) {
            let speed = (paramSchema.enum.length > 5 ? 1 : 2) * speedFactor;

            for (let i = 0; i < Math.min(paramSchema.enum.length, 7); i += 1) {
              const enumValue = paramSchema.enum[i];

              setTimeout(() => {
                updateFunction({
                  path: path + paramName,
                  value: enumValue,
                });
              }, getTime(t));
              t += speed;
            }

            setTimeout(() => {
              updateFunction({
                path: path + paramName,
                value: paramValue,
              });
            }, getTime(t));
            t += speed;
          } else {
            for (let j = 0; j < paramValue.length; j++) {
              setTimeout(() => {
                updateFunction({
                  path: path + paramName,
                  value: paramValue.slice(0, j + 1),
                });
              }, getTime(t));
              t += 0.1 * speedFactor;
            }
          }
        }
      } else if (
        paramSchema.type === RecipeParamType.Number ||
        paramSchema.type === RecipeParamType.Integer
      ) {
        if (
          paramSchema.maximum != undefined &&
          paramSchema.minimum != undefined
        ) {
          setTimeout(() => {
            updateFunction({
              path: path + paramName,
              value: paramSchema.maximum,
            });
          }, getTime(t));
          t += 2.5 * speedFactor;

          setTimeout(() => {
            updateFunction({
              path: path + paramName,
              value: paramSchema.minimum,
            });
          }, getTime(t));
          t += 2.5 * speedFactor;
        }

        setTimeout(() => {
          updateFunction({
            path: path + paramName,
            value: paramValue,
          });
        }, getTime(t));
        t += 5 * speedFactor;
      } else {
        setTimeout(() => {
          updateFunction({
            path: path + paramName,
            value: paramValue,
          });
        }, getTime(t));
        t += 0.2 * speedFactor;
      }
    }

    OutputAPI.clearOutput(session.id);
    setBodyRoute(RecipeBodyRoute.Parameters);
    setOutputTab(RecipeOutputTab.Docs);

    let requestUrl = new URL(selectedRecipe.path);
    if (requestBody && selectedRecipe.requestBody) {
      setRequestBody({});
      const params = Object.keys(requestBody);

      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const paramValue = requestBody[paramName]!;
        const paramSchema = (selectedRecipe.requestBody as JSONSchema6)
          .properties![paramName] as JSONSchema6;

        updateMagic({
          paramName,
          paramValue,
          paramSchema,
          updateFunction: updateRequestBody,
          path: ".",
          speedFactor: 0.5,
        });
      }
    }

    const recipeQueryParams = selectedRecipe.queryParams as JSONSchema6;
    if (queryParams && recipeQueryParams) {
      setQueryParams({});

      const params = Object.keys(queryParams);

      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const paramValue = queryParams[paramName]!;
        const paramSchema = recipeQueryParams.properties?.[
          paramName
        ]! as JSONSchema6;

        updateMagic({
          paramName,
          paramValue,
          paramSchema,
          updateFunction: updateQueryParams,
          path: ".",
          speedFactor: 0.5,
        });

        requestUrl.searchParams.set(paramName, paramValue as string);
      }
    }

    const recipeURLParams = selectedRecipe.urlParams as JSONSchema6;
    if (urlParams && recipeURLParams) {
      setUrlParams({});

      const params = Object.keys(urlParams);

      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const paramValue = urlParams[paramName]!;
        const paramSchema = recipeURLParams.properties?.[
          paramName
        ]! as JSONSchema6;

        updateMagic({
          paramName,
          paramValue,
          paramSchema,
          updateFunction: updateUrlParams,
          path: "",
          speedFactor: 0.5,
        });

        requestUrl.pathname = requestUrl.pathname.replace(
          `{${paramName}}`,
          String(paramValue)
        );
      }
    }

    let headers: Record<string, string> = {};
    if (selectedRecipe.authConfig !== null) {
      headers["Authorization"] = "Configure Auth / Make Real Request";
    }

    headers["Content-Type"] = "application/json"; // We shouldn't assume this by default. Lets add to options

    let requestInfo: RecipeRequestInfo = {
      url: requestUrl.toString(),
      payload: {
        method: selectedRecipe.method,
        headers: headers,
        body: (requestBody as Record<string, unknown>) || null,
      },
      options: {},
    };

    // TODO: This is old stuff, but we will no longer support this
    if ((selectedRecipe as any)["auth"] === null) {
      t += 15;
      setTimeout(() => {
        setLoadingTemplate(null);
        setOutputTab(RecipeOutputTab.Output);
      }, getTime(t));

      // Necessary, need state update for setLoading
      setTimeout(() => {
        document.getElementById(UNIQUE_ELEMENT_IDS.RECIPE_SEARCH)?.click();
      }, getTime(t));
    } else if (replay) {
      t += 15;
      setTimeout(() => {
        setIsSending(true, RecipeOutputTab.Output);
      }, getTime(t));
      t += 5;

      const { output, streaming, duration } = replay;
      const tEndValue = duration / 100;

      if (streaming) {
        const stringified = output.content as string;
        const speed = tEndValue / stringified.length;

        for (let i = 0; i < stringified.length; i++) {
          setTimeout(() => {
            OutputAPI.addOutput(
              {
                sessionId: session.id,
                sessionOutput: {
                  id: PLAYGROUND_SESSION_ID,
                  output: {
                    content: stringified.slice(0, i + 1),
                  },
                  type: RecipeOutputType.Streaming,
                },
              },
              true
            );
          }, getTime(t));
          t += speed;
        }
      } else {
        t += Math.min(15, tEndValue);
      }

      setTimeout(() => {
        OutputAPI.addOutput(
          {
            sessionId: session.id,
            sessionOutput: {
              id: PLAYGROUND_SESSION_ID,
              output,
              type: RecipeOutputType.Response,
              duration,
              requestInfo: requestInfo,
            },
          },
          true
        );
        setIsSending(false, RecipeOutputTab.Output);
      }, getTime(t));
    }

    setTimeout(() => {
      setLoadingTemplate(null);

      if (!replay && (selectedRecipe as any)["auth"] !== null) {
        setIsSending(false, RecipeOutputTab.DocTwo);
      }
    }, getTime(t));
  }, [loadingTemplate]);
}
