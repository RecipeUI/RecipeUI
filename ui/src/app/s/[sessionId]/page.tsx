import { SessionBody } from "@/app/s/[sessionId]/SessionWrapper";
import { RecipeBody } from "@/components/RecipeBody";
import { RecipeBodySearch } from "@/components/RecipeBody/RecipeBodySearch";

export default function SessionPage() {
  return (
    <div className={"flex-1 flex flex-col"}>
      <RecipeBodySearch />
      <SessionBody />
    </div>
  );
}
