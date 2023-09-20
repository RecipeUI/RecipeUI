import { ModuleSetting } from "types/database";

export function ResourcesModule({
  resourceSection,
}: {
  resourceSection: NonNullable<ModuleSetting["resources"]>;
}) {
  return (
    <div className="border  p-4 rounded-md">
      <h2 className="text-xl font-bold">{resourceSection.title}</h2>
      {resourceSection.description && (
        <p className="text-sm">{resourceSection.description}</p>
      )}
      {resourceSection.docs.length > 0 && (
        <ul className="list-disc list-inside mt-2">
          {resourceSection.docs.map((doc, i) => {
            return (
              <li key={i}>
                <a href={doc.url} target="_blank" className="link ">
                  {doc.title || doc.url}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
