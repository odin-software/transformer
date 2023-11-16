import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";
import stylesheet from "~/tailwind.css";
import componentsStylesheet from "./components/components.css";
import lato100 from "@fontsource/lato/100.css";
import lato300 from "@fontsource/lato/300.css";
import lato400 from "@fontsource/lato/index.css";
import lato700 from "@fontsource/lato/700.css";
import lato900 from "@fontsource/lato/900.css";

export const links = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: componentsStylesheet },
  { rel: "stylesheet", href: lato100 },
  { rel: "stylesheet", href: lato300 },
  { rel: "stylesheet", href: lato400 },
  { rel: "stylesheet", href: lato700 },
  { rel: "stylesheet", href: lato900 }
];

export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: "Transformer",
    viewport: "width=device-width,initial-scale=1"
  },
  {
    property: "og:title",
    content: "Transformer"
  }
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <main className="flex flex-col items-center h-screen bg-gradient-to-b	from-gradientT to-gradientB">
          <div className="flex flex-col items-center justify-center w-full h-60">
            <div className="text-right">
              <h1 className="title">Transformer</h1>
              <sub className="subtitle">of images</sub>
            </div>
          </div>
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
