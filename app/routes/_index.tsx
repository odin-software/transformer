import clsx from "clsx";
import { useRef } from "react";
import { useDropzone } from "react-dropzone-esm";
import { ActionFunctionArgs } from "@remix-run/router";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { Transition } from "@headlessui/react";

import { bytesToSize } from "~/utils/calc";
import { convertSwitch } from "~/utils/sharp.server";
import { createSupabaseServerClient } from "~/utils/supabase.server";

import { Loading } from "~/components/Loading";

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.formData();
  const supabase = createSupabaseServerClient({ request });
  const action = data.get("action");
  data.delete("action");

  const entries = Array.from(data.entries());
  const convertTo = action === "to WebP" ? "webp" : "png";

  const [name, blob] = entries[0] as [string, Blob];
  const blobBuffer = await blob.arrayBuffer();
  const sharpInstance = await convertSwitch(convertTo, blobBuffer);
  const buffer = await sharpInstance.toBuffer();
  const file = new File([buffer], name, { type: `image/${convertTo}` });
  const uploadName = name.replace(/\.[^/.]+$/, `.${convertTo}`);
  const supaError = await supabase.storage
    .from("transformer")
    .upload(uploadName, file, {
      upsert: true
    });
  if (supaError.error) {
    return null;
  }
  const { data: url } = supabase.storage
    .from("transformer")
    .getPublicUrl(uploadName);

  return { name: uploadName, url };
};

export default function Index() {
  const selectInputRef = useRef<HTMLSelectElement>(null);
  const navigation = useNavigation();
  const submit = useSubmit();
  const data = useActionData<typeof action>();
  const isTransforming = Boolean(navigation.state === "submitting");

  const { acceptedFiles, isDragActive, getRootProps, getInputProps } =
    useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
      multiple: false,
      maxSize: 5 * 1024 * 1024,
      disabled: isTransforming,
      async onDrop(acceptedFiles: File[]) {
        return acceptedFiles;
      }
    });

  const pendingFiles = acceptedFiles.map((file) => {
    return (
      <li className="flex w-full justify-between" key={file.name}>
        <span>
          {file.name} - {bytesToSize(file.size)}
        </span>
      </li>
    );
  });

  const transformedFiles = () => {
    if (data) {
      return (
        <li className="flex w-full justify-between underline" key={data.name}>
          <a href={data.url.publicUrl} target="_blank" download>
            <span>{data.name}</span>
          </a>
        </li>
      );
    }
    return null;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const body = new FormData();
    const name = acceptedFiles[0].name;
    const blob = acceptedFiles[0].slice();
    body.append(name, blob);
    body.append("action", selectInputRef.current?.value ?? "to WebP");

    submit(body, {
      action: "?index",
      method: "POST",
      encType: "multipart/form-data"
    });
  };

  return (
    <section className="font-lato">
      {isTransforming && <Loading classname="fill-powder" />}
      <form
        method="post"
        encType="multipart/form-data"
        className="col-span-full"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
      >
        <label
          htmlFor="cover-photo"
          className="block text-sm font-medium leading-6 text-white"
        >
          Image to convert
        </label>
        <div
          {...getRootProps()}
          className={clsx(
            "mt-2 flex justify-center rounded-lg border border-dashed px-32 py-10",
            isDragActive ? "border-gray-400" : "border-titleText"
          )}
        >
          <div className="text-center">
            <div className="mt-4 flex justify-center text-sm leading-6">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-cinereous font-semibold text-powder focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:ring-1 hover:scale-[102%] transition-all p-2"
              >
                <span>Upload a file</span>
                <input
                  name="file-upload"
                  className="sr-only"
                  {...getInputProps()}
                />
              </label>
            </div>
            <div className="text-xs text-powder">
              <p>
                or
                <br /> drag and drop
              </p>
              <p className="leading-5">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        <Transition
          show={pendingFiles.length > 0 && !isTransforming}
          enter="transition-opacity duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="bg-cinereous rounded-md p-5 text-powder mt-4">
            <ul>{pendingFiles}</ul>
          </div>
          {data && (
            <div className="bg-green-700 rounded-md p-5 text-powder mt-4">
              <ul>{transformedFiles()}</ul>
            </div>
          )}
          <div>
            <label
              htmlFor="method"
              className="block text-sm font-medium leading-6 text-powder mt-4"
            >
              Formats
            </label>
            <select
              id="method"
              name="method"
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-powder"
              ref={selectInputRef}
            >
              <option>to WebP</option>
              <option>to PNG</option>
            </select>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-cinereous text-powder rounded-md py-4 px-6 hover:ring-1 hover:border-blue-300 hover:scale-[102%] transition-all"
              disabled={isTransforming || pendingFiles.length === 0}
            >
              Convert
            </button>
          </div>
        </Transition>
      </form>
    </section>
  );
}
