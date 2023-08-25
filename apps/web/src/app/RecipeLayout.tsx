import { Navbar } from "ui/components/Navbar/Navbar";

export function RecipeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen flex overflow-y-auto">
      <div className="flex flex-1 flex-col overflow-y-scroll">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
