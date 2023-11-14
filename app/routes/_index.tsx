import { useState } from "react";

export default function Index() {
  const [step, setStep] = useState(1);
  return (
    <main className="flex flex-col items-center h-screen bg-gradient-to-b	from-gradientT to-gradientB">
      <div className="flex flex-col items-center justify-center w-full h-60">
        <div className="text-right">
          <h1 className="title">Transformer</h1>
          <sub className="subtitle">of images</sub>
        </div>
      </div>
      {step === 1 && (
        <div className="col-span-full">
          <label
            htmlFor="cover-photo"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Cover photo
          </label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-text-titleText px-12 py-10">
            <div className="text-center">
              <div className="mt-4 flex text-sm leading-6 text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-gray-600">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
