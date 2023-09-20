"use client";
import { RecipeOutputType } from "types/database";
import { SessionOutput } from "../recipeSession";
import { useEffect, useState } from "react";
import { PLAYGROUND_SESSION_ID } from "../../utils/constants/main";
import { getOutputStore, eventEmitter } from ".";

import { restrictObjectsAndArrays } from "utils";

export class OutputAPI {
  static clearOutput = async (sessionId: string) => {
    const store = await getOutputStore();
    await store.delete(sessionId);

    eventEmitter.emit("refreshState");
  };

  static addOutput = async (
    {
      sessionId,
      sessionOutput,
    }: {
      sessionId: string;
      sessionOutput: SessionOutput;
    },
    mock?: boolean
  ) => {
    const store = await getOutputStore();
    const outputs = await store.get(sessionId);

    if (!outputs || sessionId === PLAYGROUND_SESSION_ID) {
      await store.put(
        [
          {
            ...sessionOutput,
            ...(!mock
              ? {
                  created_at: new Date().toISOString(),
                }
              : null),
          },
        ],
        sessionId
      );
    } else {
      // We should override an existing sessionOutputId if it exits
      const previousSession = outputs.find(
        (output) => output.id === sessionOutput.id
      );

      if (previousSession) {
        await store.put(
          outputs.map((output) => {
            if (output.id === sessionOutput.id) {
              return sessionOutput;
            }

            return output;
          }),
          sessionId
        );
      } else {
        // Let's make sure the old output is minified.
        const minifiedOutput = outputs.map((output) => {
          return {
            ...output,
            output: restrictObjectsAndArrays<typeof output.output>(
              output.output
            ),
          };
        });

        const newOutput = [...minifiedOutput, sessionOutput];

        // TODO: Let's let users add an option to limit the output.
        // Limiting to 10 because it should be enough for most use cases.
        if (newOutput.length > 10) {
          newOutput.shift();
        }

        await store.put(newOutput, sessionId);
      }
    }

    eventEmitter.emit("refreshState");
  };

  static setOutput = async (outputId: string) => {
    eventEmitter.emit("refreshState", outputId);
  };

  static getOutput = async (sessionId?: string) => {
    if (!sessionId) return undefined;

    const store = await getOutputStore();
    return store.get(sessionId);
  };

  static _migrateOutput = async (
    oldSessionId: string,
    newSessionId: string
  ) => {
    const store = await getOutputStore();
    const output = await store.get(oldSessionId);

    if (output) {
      await store.put(output, newSessionId);
      await store.delete(oldSessionId);
    }
  };
}

const DEFAULT_OUTPUT: SessionOutput = {
  output: {},
  type: RecipeOutputType.Void,
};

export function useOutput(sessionId?: string) {
  const [output, _setOutput] = useState<SessionOutput>(DEFAULT_OUTPUT);
  const [allOutputs, setAllOutputs] = useState<SessionOutput[]>([]);

  useEffect(() => {
    function refreshState(outputId?: string) {
      OutputAPI.getOutput(sessionId).then((_output) => {
        setAllOutputs(_output?.reverse() || []);

        if (outputId && _output) {
          _setOutput(_output.find((o) => o.id === outputId) || DEFAULT_OUTPUT);
        } else {
          _setOutput(_output ? _output[0] : null || DEFAULT_OUTPUT);
        }
      });
    }

    refreshState();

    // EventEmitters might be overkill because you can do context, but wanted to try this out!!!
    eventEmitter.on("refreshState", refreshState);
    return () => {
      eventEmitter.off("refreshState", refreshState);
    };
  }, [sessionId]);

  return {
    output,
    allOutputs,
  };
}
