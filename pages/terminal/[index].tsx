import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";

// Dynamic import to avoid SSR issues with xterm
const LogTerminal = dynamic(() => import("../../components/LogTerminal"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1e1e1e",
        color: "#ffffff",
        fontSize: "16px",
      }}
    >
      Loading terminal...
    </div>
  ),
});

interface TerminalPageProps {
  index: string;
}

const TerminalPage: React.FC<TerminalPageProps> = ({ index }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Terminal #{index} - Threshold ECDSA Web Logs</title>
        <meta name="description" content={`Real-time logs for Threshold ECDSA Web service ${index}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        style={{
          height: "100vh",
          width: "100vw",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          backgroundColor: "#1e1e1e",
        }}
      >
        <LogTerminal index={index} />
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { index } = context.query;

  // Validate index parameter
  if (!index || typeof index !== "string" || !/^\d+$/.test(index)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      index,
    },
  };
};

export default TerminalPage;
