"use client";
import { RecipeSessionFolderExtended } from "types/database";
import { FolderAPI } from "../../../state/apiSession/FolderAPI";
import { Modal } from "../../Modal";
import { useForm } from "react-hook-form";

export function FolderModal({
  onClose,
  addToFolder,
}: {
  onClose: () => void;
  addToFolder?: RecipeSessionFolderExtended;
}) {
  const { register, handleSubmit } = useForm<{ folderName: string }>({
    defaultValues: {},
  });

  const onSubmit = handleSubmit((data) => {
    FolderAPI.addFolder(data.folderName, addToFolder?.id);
    onClose();
  });

  return (
    <Modal header="New Folder" onClose={onClose} size="sm" autoFocus>
      <form className="mt-1 flex flex-col space-y-2" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Folder Name"
          className="input input-bordered input-sm"
          {...register("folderName", {
            required: true,
          })}
        />
        <button className="mt-4 btn btn-neutral w-fit btn-sm" type="submit">
          Create
        </button>
      </form>
    </Modal>
  );
}
