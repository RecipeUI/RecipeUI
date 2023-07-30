import { Navbar } from "./components/Navbar";
import { RecipeBodyContainer } from "./components/RecipeBody/RecipeBodyContainer";
import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    // TODO: Remove bg-blue-100 when done testing
    <div className="w-full h-screen">
      <Navbar />
      <div className="flex app-container">
        <Sidebar />
        <RecipeBodyContainer />
      </div>
    </div>
  );
}

export default App;
