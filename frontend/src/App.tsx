import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";


import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Salesmen from "./pages/Salesmen";
import Staff from "./pages/Staff";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import Items from "./pages/Items";
import Categories from "./pages/Categories";
import Investors from "./pages/Investors";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import PartiesMaster from "./pages/PartiesMaster";
import PaymentEntry from "./pages/PaymentEntry"
import Invoices from "./pages/Invoices"
import ReceiptEntry from "./pages/ReceiptEntry"
import ProjectStatement from "./pages/ProjectStatement"
import SOA from "./pages/SoA"
import BalanceSheet from "./pages/BalanceSheetPage"
import CurrentAssets from "./pages/CurrentAssets"
import InternalPayments from "./pages/InternalPayments"

import IncomeDetailsPage from "./pages/IncomeDetailsPage";
import ExpenseDetailsPage from "./pages/ExpenseDetailsPage";
import SalesmanDetails from "./pages/SalesmanDetailsPage";
import InvestorDetailsPage from "./pages/InvestorDetailsPage";
import ClientDetailsPage from "./pages/ClientDetailsPage";
import OthersDetailsPage from "./pages/OthersDetailsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import PaymentEntryDetailsPage from "./pages/PaymentEntryDetails";
import InvoicesDetailsPage from "./pages/InvoiceDetailsPage";
import ReceiptEntryDetails from "./pages/ReceiptEntryDetailsPage";


/* -------------------------------
   LAYOUT WRAPPER
-------------------------------- */
/* Diagnostic LayoutWrapper — paste into App.tsx replacing your current wrapper */
// const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const location = useLocation();

//   // Normalize path for HashRouter or BrowserRouter
//   const raw = (location.hash && location.hash.length > 0) ? location.hash : location.pathname;
//   const pathname = raw.replace(/^#/, "") || "/";

//   const protectedPages = [
//     "/dashboard", "/expenses", "/income", "/salesmen", "/staff", "/billing",
//     "/items", "/categories", "/investors", "/clients", "/projects", "/others"
//   ];
//   const dynamicProtected = [
//     "/income/details/", "/expenses/details/", "/salesmen/details/",
//     "/investors/details/", "/clients/details/", "/others/details/", "/project/details/"
//   ];

//   const isStaticProtected = protectedPages.includes(pathname);
//   const isDynamicProtected = dynamicProtected.some((p) => pathname.startsWith(p));
//   const showLayout = isStaticProtected || isDynamicProtected;

//   // Diagnostic log (will appear in DevTools Console)
//   console.log("LAYOUT DIAG:", { raw, pathname, isStaticProtected, isDynamicProtected, showLayout });

//   return (
//     <div>
//       {showLayout && <Topbar />}
//       <div className="flex">
//         {showLayout && <Sidebar />}
//         <div className="main-content" style={{
//           marginTop: showLayout ? "60px" : 0,
//           paddingLeft: showLayout ? "15vw" : 0
//         }}>
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };


/////

// Temporary test — put in App.tsx replacing LayoutWrapper
// const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   return (
//     <div>
//       <Topbar />
//       <div className="flex">
//         <Sidebar />
//         <div className="main-content" style={{ marginTop: "60px", paddingLeft: "15vw" }}>
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };

/////
// const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const location = useLocation();

//   // Electron + HashRouter — detect correct path
//   const raw = window.location.hash || location.hash || "";
//   const pathname = raw.replace(/^#/, "") || "/";

//   // Pages that should NOT show sidebar/topbar
//   const noLayout = ["/login"];

//   const hideLayout = noLayout.includes(pathname);

//   return (
//     <div>
//       {/* Always show after login */}
//       {!hideLayout && <Topbar />}

//       <div className="flex">
//         {!hideLayout && <Sidebar />}

//         <div
//           className="main-content"
//           style={{
//             marginTop: !hideLayout ? "60px" : "0px",
//             paddingLeft: !hideLayout ? "15vw" : "0px",
//           }}
//         >
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };


const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Electron + HashRouter — detect correct path
  const raw = window.location.hash || location.hash || "";
  const pathname = raw.replace(/^#/, "") || "/";

  // Pages that should NOT show sidebar/topbar
  const noLayout = ["/login"];

  const hideLayout = noLayout.includes(pathname);

  return (
    <div>
      {!hideLayout && <Topbar />}

      <div className="flex">
        {!hideLayout && <Sidebar />}

        <div
          className="main-content"
          style={{
            marginTop: !hideLayout ? "0px" : "0px",
            paddingLeft: !hideLayout ? "15vw" : "0px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};


/* -------------------------------
   MAIN APP COMPONENT
-------------------------------- */
function App() {
  return (
    <LayoutWrapper>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Default route → dashboard */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Protected main pages */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
        <Route path="/salesmen" element={<ProtectedRoute><Salesmen /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/investors" element={<ProtectedRoute><Investors /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/parties-master" element={<ProtectedRoute><PartiesMaster /></ProtectedRoute>} />
        <Route path="/payment-entry" element={<ProtectedRoute><PaymentEntry /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/receipt-entry" element={<ProtectedRoute><ReceiptEntry /></ProtectedRoute>} />
        <Route path="/project-statement" element={<ProtectedRoute><ProjectStatement /></ProtectedRoute>} />
        <Route path="/soa" element={<ProtectedRoute><SOA /></ProtectedRoute>} />
        <Route path="/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
        <Route path="/current-assets" element={<ProtectedRoute><CurrentAssets /></ProtectedRoute>} />
        <Route path="/internal-payment" element={<ProtectedRoute><InternalPayments /></ProtectedRoute>} />

        {/* Dynamic Details pages */}
        <Route path="/income/details/:id" element={<ProtectedRoute><IncomeDetailsPage /></ProtectedRoute>} />
        <Route path="/expenses/details/:id" element={<ProtectedRoute><ExpenseDetailsPage /></ProtectedRoute>} />
        <Route path="/salesmen/details/:id" element={<ProtectedRoute><SalesmanDetails /></ProtectedRoute>} />
        <Route path="/investors/details/:id" element={<ProtectedRoute><InvestorDetailsPage /></ProtectedRoute>} />
        <Route path="/clients/details/:id" element={<ProtectedRoute><ClientDetailsPage /></ProtectedRoute>} />
        <Route path="/others/details/:id" element={<ProtectedRoute><OthersDetailsPage /></ProtectedRoute>} />
        <Route path="/project/details/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
        <Route path="/payment-entry/details/:id" element={<ProtectedRoute><PaymentEntryDetailsPage /></ProtectedRoute>} />
        <Route path="/invoices/details/:id" element={<ProtectedRoute><InvoicesDetailsPage /></ProtectedRoute>} />
        <Route path="/receipt/details/:id" element={<ProtectedRoute><ReceiptEntryDetails /></ProtectedRoute>} />




      </Routes>
    </LayoutWrapper>
  );
}

export default App;
