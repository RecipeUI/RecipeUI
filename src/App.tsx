// import { Navbar } from "./components/Navbar";
import { RecipeBodyContainer } from "./components/RecipeBody/RecipeBodyContainer";
import { RecipeSidebar } from "./components/RecipeSidebar";
// import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* TODO: Navbar should be hidden in desktop mode */}
      {/* <Navbar /> */}
      <div className="flex flex-1 border-t">
        {/* <Sidebar /> */}
        <RecipeSidebar />
        <RecipeBodyContainer />
      </div>
    </div>
  );
}

export default App;
