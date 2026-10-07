import { useEffect, useState } from "react";
import { getToken, navigate } from "./lib/api";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export default function App() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const updatePath = () => setPath(currentPath());
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  const authenticated = Boolean(getToken());

  useEffect(() => {
    if (path === "/") navigate(authenticated ? "/dashboard" : "/login", true);
    else if (path === "/dashboard" && !authenticated) navigate("/login", true);
    else if (path === "/login" && authenticated) navigate("/dashboard", true);
  }, [authenticated, path]);

  if (path === "/dashboard" && authenticated) return <DashboardPage />;
  if (path === "/login" && !authenticated) return <LoginPage />;
  return null;
}
