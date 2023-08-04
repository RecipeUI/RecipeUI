import { Navbar } from "./components/Navbar";
import { RecipeContainer } from "./components/RecipeContainer";
// import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <div className="w-full h-screen flex flex-col">
      <Navbar />
      <RecipeContainer />
    </div>
  );
}

export default App;
