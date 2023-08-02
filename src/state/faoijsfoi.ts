// import { create } from "zustand";
// import { v4 as uuidv4 } from "uuid";
// import { produce } from "immer";

// interface RecipeSession {
//   id: string;
//   name: string;
// }

// export interface RecipeSessionManagerState {
//   currentSession: RecipeSession;
//   sessions: RecipeSession[];
//   setCurrentSession: (session: RecipeSession) => void;
//   closeSession: (session: RecipeSession) => void;
//   addSession: (session?: RecipeSession) => void;
// }

// function generateNewSession() {
//   return {
//     id: uuidv4(),
//     name: "New Session",
//   };
// }

// export const useRecipeSessionManager = create<RecipeSessionManagerState>(
//   (set) => {
//     const mainSession = generateNewSession();

//     return {
//       currentSession: mainSession,
//       sessions: [mainSession],
//       setCurrentSession: (session) => set(() => ({ currentSession: session })),

//       //   This needs to be stronger, like take in a recipe if it takes in default data
//       addSession: (session) =>
//         set((prevState) => {
//           const newSession = session ?? generateNewSession();

//           return {
//             currentSession: newSession,
//             sessions: [...prevState.sessions, newSession],
//           };
//         }),
//       deleteSession: (session) => {

//       },
//     };
//   }
// );
