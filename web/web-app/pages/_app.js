import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import Layout from "../components/Layout";

export async function getServerSideProps(context) {
  console.log("CAGRILDIM")
  const res = await fetch("http://127.0.0.1:5000/user/logged_in", {credentials: "include"})
  const logged_in = await res.json()
  return {
    props: {
      logged_in: logged_in.logged_in,
    }
  }
}

function MyApp({ Component, pageProps, logged_in }) {
  return (
    <Layout>
      <Component {...pageProps} />;
    </Layout>
  );
}

export default MyApp;
