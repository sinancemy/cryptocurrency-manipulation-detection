import "tailwindcss/tailwind.css"
import "../styles/globals.css"
import Layout from "../components/Layout"
import { useCookies } from "react-cookie"

function MyApp({ Component, pageProps }) {

  const [cookie, setCookie] = useCookies()
  pageProps.loggedIn = "token" in cookie
  pageProps.token = cookie.token

  return (
    <Layout {...pageProps}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;