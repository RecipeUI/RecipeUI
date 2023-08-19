import Link from "next/link";
import { isTauri } from "../../utils/main";

export function RecipeHomeHero() {
  return (
    <div className="sm:block sm:m-4 bg-[#FFECC1] p-6 sm:p-8 rounded-md mb-4">
      <h1 className="font-bold text-xl">Test APIs in seconds</h1>
      <p className="mt-2 sm:text-base">
        {
          "Use APIs below immediately, no coding experience required. See how we're making API's easier for teams and developers of all backgrounds."
        }
      </p>
      <div className="mt-4 flex-col sm:flex-row gap-2 hidden sm:flex">
        <Link href="/OpenAI">
          <button className="btn btn-neutral w-full">Try OpenAI</button>
        </Link>
        {/* {!isTauri() && (
            <button className="btn btn-neutral hidden sm:block">
              Download for Desktop
            </button>
          )} */}
      </div>
    </div>
  );
}
