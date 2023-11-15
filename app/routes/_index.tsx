import clsx from "clsx";
import { useRef } from "react";
import { useDropzone } from "react-dropzone-esm";
import { Transition } from "@headlessui/react";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/router";
import { bytesToSize } from "~/utils/calc";
import { convertToWebp } from "~/utils/sharp.server";
import { createSupabaseServerClient } from "~/utils/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.formData();
  const supabase = createSupabaseServerClient({ request });
  const action = data.get("action");
  data.delete("action");
  const entries = Array.from(data.entries());

  if (action === "to WebP") {
    const [name, blob] = entries[0] as [string, Blob];
    const blobBuffer = await blob.arrayBuffer();
    const sharpInstance = await convertToWebp(blobBuffer);
    const buffer = await sharpInstance.toBuffer();
    const file = new File([buffer], name, { type: "image/webp" });
    const supaError = await supabase.storage
      .from("transformer")
      .upload(name.replace(/\.[^/.]+$/, ".webp"), file, {
        upsert: true
      });
    if (supaError.error) {
      return null;
    }
    const { data: url } = supabase.storage
      .from("transformer")
      .getPublicUrl(name.replace(/\.[^/.]+$/, ".webp"));

    return url;
  }
  return null;
};

export default function Index() {
  const selectInputRef = useRef<HTMLSelectElement>(null);
  const navigation = useNavigation();
  const submit = useSubmit();

  const data = useActionData<typeof action>();
  const { acceptedFiles, isDragActive, getRootProps, getInputProps, inputRef } =
    useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
      multiple: false,
      maxSize: 5 * 1024 * 1024,
      async onDrop(acceptedFiles: File[]) {
        console.log(acceptedFiles);
        return acceptedFiles;
      }
    });

  const pendingFiles = acceptedFiles.map((file) => (
    <li key={file.name}>
      {file.name} - {bytesToSize(file.size)}
    </li>
  ));

  // const linkk = data ? window.URL.createObjectURL(data[0].file) : null;
  // console.log(data ? data[0].file : null);
  const linkk = () => {
    if (data) {
      console.log("FILE LINKK", data);
      return window.URL.createObjectURL(new Blob([data]));
    }
    return null;
  };

  const isTransforming = Boolean(navigation.state === "submitting");
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
      <form
        method="post"
        encType="multipart/form-data"
        className="col-span-full"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
      >
        {!isTransforming && (
          <>
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
          </>
        )}
        <Transition
          show={pendingFiles.length > 0}
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
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              ref={selectInputRef}
            >
              <option>to WebP</option>
              <option>to PNG</option>
            </select>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-cinereous text-powder rounded-md py-4 px-6"
              disabled={isTransforming || pendingFiles.length === 0}
            >
              Convert
            </button>
          </div>
        </Transition>
      </form>
      {data && (
        <div className="mt-4">
          <a target="_blank" href={data.publicUrl} download="image.webp">
            Download
          </a>
        </div>
      )}
      <button
        onClick={() => {
          console.log(linkk());
        }}
      >
        Linkkkk
      </button>
    </section>
  );
}
