import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import Layout from "../components/Layout";

function MyApp({ Component, pageProps }) {
  return (
    <Layout {...pageProps}>
      <Component />
    </Layout>
  );
}

export default MyApp;

// At each page, check if the user has logged in.
MyApp.getInitialProps = async (appContext) => {
  const res = await fetch("http://127.0.0.1:5000/user/logged_in", {credentials: "include"})
  const logged_in = await res.json()
  return {
    pageProps: {
        logged_in: logged_in.logged_in,
    }
  }
}
