import "../styles/globals.css"
import Layout from "../components/Layout"
import { useCookies } from "react-cookie"
import { UserProvider } from "../user-hook"

function MyApp({ Component, pageProps }) {

  const [cookie, setCookie] = useCookies()
  pageProps.loggedIn = "token" in cookie
  pageProps.token = cookie.token

  return (
    <UserProvider>
      <Layout {...pageProps}>
        <Component {...pageProps} />
      </Layout>
    </UserProvider>
  );
}

export default MyApp;