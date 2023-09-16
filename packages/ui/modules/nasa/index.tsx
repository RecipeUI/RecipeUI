import { useState } from "react";

/*
    NASA specifically uses query_param api_key
*/
export default function NASAModule() {
  const [apiKey, setApiKey] = useState("api_key");

  const onSubmit = () => {};

  return (
    <div className="h-full space-y-4 p-4">
      <div className="flex items-center border p-4 rounded-md  text-white">
        <img
          src="https://api.nasa.gov/assets/img/favicons/favicon-192.png"
          className="w-24"
        />
        <div className="ml-2">
          <h2 className="text-xl font-bold">NASA</h2>
          <p className="text-sm">
            Use NASA api's to get the latest imagery and insights about Earth,
            Mars, and more about the Solar System.
          </p>
          <div className="mt-2">
            <div className="badge badge-neutral">Free</div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold">Auth</h2>
        <p>NASA's API is freeaaa. </p>
        <div className="grid grid-cols-2 gap-x-4">
          <button className="btn btn-sm btn-accent" onClick={() => {}}>
            Setup Demo
          </button>
          <button className="btn btn-sm btn-accent">Setup Prod</button>
        </div>
      </div>
    </div>
  );
}
