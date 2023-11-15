import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log(request);
  return new Response("Hello World!", {
    headers: {
      "Content-Type": "text/plain"
    }
  });
};

export default function Results() {
  const data = useLoaderData<typeof loader>();
  console.log(data);

  return (
    <section className="font-lato">
      <h1>Results</h1>
    </section>
  );
}
