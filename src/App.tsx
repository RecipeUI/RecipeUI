import { Navbar } from "./components/Navbar";
import { RecipeContainer } from "./components/RecipeContainer";
// import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* TODO: Navbar should be hidden in desktop mode */}
      <Navbar />
      <RecipeContainer />
    </div>
  );
}

export default App;
