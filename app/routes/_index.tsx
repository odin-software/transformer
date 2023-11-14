import { Form } from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/router";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const files = Object.fromEntries(data.entries());
  console.log(files);
}

export default function Index() {
  const [files, setFiles] = useState([]);
  return (
    <section>
      <Form className="col-span-full">
        <label
          htmlFor="cover-photo"
          className="block text-sm font-medium leading-6 text-white"
        >
          Cover photo
        </label>
        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-titleText px-6 py-10">
          <div className="text-center">
            <div className="mt-4 flex text-sm leading-6 text-gray-400">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-titleText focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    setFiles(e.currentTarget.files);
                    console.log(e.currentTarget.files);
                  }}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-titleText">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      </Form>
    </section>
  );
}
