import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { DocumentsProvider } from "../context/DocumentsContext";

export default function DashboardLayout() {
  return (
    <DocumentsProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileNavbar />
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </DocumentsProvider>
  );
}
