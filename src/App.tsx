import { Navbar } from "./components/Navbar";
import { RecipeBody } from "./components/RecipeBody/RecipeBody";
import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    // TODO: Remove bg-blue-100 when done testing
    <div className="w-full h-screen bg-blue-100">
      <Navbar />
      <div className="flex bg-red-200 h-full">
        <Sidebar />
        <RecipeBody />
      </div>
    </div>
  );
}

export default App;
