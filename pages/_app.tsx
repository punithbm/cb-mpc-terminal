import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
        }

        body {
          background-color: #1e1e1e;
          color: #ffffff;
        }

        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #2d2d2d;
        }

        ::-webkit-scrollbar-thumb {
          background: #555555;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #777777;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
