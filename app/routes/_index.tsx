import { Form } from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/router";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone-esm";

export async function action({ request }: ActionFunctionArgs) {
  console.log(request);
  const data = await request.formData();
  console.log(data);
  const files = Object.fromEntries(data.entries());
  console.log(files);
  return null;
}

export default function Index() {
  const { acceptedFiles, isDragActive, getRootProps, getInputProps } =
    useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
      multiple: true,
      maxSize: 5 * 1024 * 1024,
      async onDrop(acceptedFiles: File[]) {
        console.log(acceptedFiles);
        return acceptedFiles;
      }
    });
  const files = acceptedFiles.map((file) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
    </li>
  ));

  return (
    <section className="font-lato">
      <Form method="post" className="col-span-full">
        <label
          htmlFor="cover-photo"
          className="block text-sm font-medium leading-6 text-white"
        >
          Images to convert
        </label>
        <div
          {...getRootProps()}
          className={clsx(
            "mt-2 flex justify-center rounded-lg border border-dashed px-32 py-10",
            isDragActive ? "border-gray-400" : "border-titleText"
          )}
        >
          <div className="text-center">
            <div className="mt-4 flex justify-center text-sm leading-6 text-gray-400">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-titleText focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500 p-2"
              >
                <span>Upload a file</span>
                <input
                  name="file-upload"
                  className="sr-only"
                  {...getInputProps()}
                />
              </label>
            </div>
            <div className="text-xs text-titleText">
              <p className="">
                or
                <br /> drag and drop
              </p>
              <p className="text-xs leading-5 text-titleText">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        </div>
        <div className="">
          <button type="submit">Convert</button>
        </div>
      </Form>
      <div>
        <ul>{files}</ul>
      </div>
    </section>
  );
}
