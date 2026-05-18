import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import StadiumBackground from "./StadiumBackground";

export default function Layout() {
  return (
    <>
      <StadiumBackground />
      <div className="relative min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}
