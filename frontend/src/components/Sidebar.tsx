// frontend/src/components/Sidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

import {
    LayoutDashboard,
    Receipt,
    FileText,
    Users,
    UserCog,
    Boxes,
    FolderKanban,
    ClipboardList,
    ShieldUser,
    SlidersHorizontal,
    UserPlus,
    Coins,
    ChevronDown,
    Handshake
} from "lucide-react";

import creworaLogo from "../assets/crewora-logo.png"; // <- import asset
import "../styles/sidebar.css";

const Sidebar: React.FC = () => {
    const location = useLocation();

    // normalize path (same logic as LayoutWrapper)
    const raw = location.hash && location.hash.length > 0 ? location.hash : location.pathname;
    const pathname = raw.replace(/^#/, "");

    const companyName = localStorage.getItem("companyName") || "Company";
    const isElite = companyName.toLowerCase() === "elite avenue";
    const [openAccounts, setOpenAccounts] = React.useState(false);
    const [openReports, setOpenReports] = React.useState(false);
    const [openMasters, setOpenMasters] = React.useState(false);


    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                <img src={creworaLogo} alt="Crewora Logo" className="logo-img" />
            </div>

            <div className="project-selector-box">
                {/* optional project selector */}
            </div>

            <div className="sidebar-items-wrapper">
                <ul className="sidebar-menu">
                    <li className="menu-section">
                        <Link to="/dashboard" className={`sidebar-link ${pathname === "/dashboard" ? "active" : ""}`}>
                            <LayoutDashboard size={20} />
                            <span>DASHBOARD</span>
                        </Link>
                    </li>

                    {/* ACCOUNTS */}
                    <div
                        className="section-label dropdown-header"
                        onClick={() => setOpenAccounts(!openAccounts)}
                    >
                        <div className="label-left">
                            <span className="section-icon"><FolderKanban size={20} /></span>
                            ACCOUNTS
                        </div>

                        <ChevronDown
                            className={`chevron ${openAccounts ? "rotate" : ""}`}
                            size={20}
                        />
                    </div>

                    {openAccounts && (
                        <ul className="submenu">

                            {/* NOT A DROPDOWN — JUST TITLE */}
                            

                            {/* TRANSACTION LINKS */}
                            <li><Link to="/payment-entry" className={`submenu-link ${pathname === "/payment-entry" ? "active" : ""}`}><Receipt size={18} />Payment Entry</Link></li>
                            <li><Link to="/internal-payment" className={`submenu-link ${pathname === "/internal-payment" ? "active" : ""}`}><Receipt size={18} />Internal Payment</Link></li>
                            <li><Link to="/invoices" className={`submenu-link ${pathname === "/invoices" ? "active" : ""}`}><Receipt size={18} />Invoices</Link></li>
                            <li><Link to="/receipt-entry" className={`submenu-link ${pathname === "/receipt-entry" ? "active" : ""}`}><Receipt size={18} />Receipt Entry</Link></li>
                            <li><Link to="/investors" className={`submenu-link ${pathname === "/investors" ? "active" : ""}`}><Receipt size={18} />Investors</Link></li>
                        </ul>
                    )}


                    <div
                        className="section-label dropdown-header"
                        onClick={() => setOpenReports(!openReports)}
                    >
                        <div className="label-left">
                            <span className="section-icon"><FileText size={20} /></span>
                            REPORTS
                        </div>

                        <ChevronDown className={`chevron ${openReports ? "rotate" : ""}`} size={20} />
                    </div>

                    {openReports && (
                        <ul className="submenu">
                            <li><Link to="/project-statement" className={`submenu-link ${pathname === "/project-statement" ? "active" : ""}`}><Receipt size={18} />Project Statement</Link></li>
                            <li><Link to="/soa" className={`submenu-link ${pathname === "/soa" ? "active" : ""}`}><Receipt size={18} />Statement of Account</Link></li>
                            <li><Link to="/balance-sheet" className={`submenu-link ${pathname === "/balance-sheet" ? "active" : ""}`}><Receipt size={18} />Balance Sheet</Link></li>
                        </ul>
                    )}




                    <div
                        className="section-label dropdown-header"
                        onClick={() => setOpenMasters(!openMasters)}
                    >
                        <div className="label-left">
                            <span className="section-icon"><ShieldUser size={20} /></span>
                            MASTERS
                        </div>

                        <ChevronDown className={`chevron ${openMasters ? "rotate" : ""}`} size={20} />
                    </div>

                    {openMasters && (
                        <ul className="submenu" >
                            <li><Link to="/clients" className={`submenu-link ${pathname === "/clients" ? "active" : ""}`}><UserCog size={18} />Clients</Link></li>
                            <li><Link to="/projects" className={`submenu-link ${pathname === "/projects" ? "active" : ""}`}><Coins size={18} />Projects</Link></li>
                            <li><Link to="/salesmen" className={`submenu-link ${pathname === "/salesmen" ? "active" : ""}`}><Handshake size={18} />Salesman</Link></li>
                            <li><Link to="/parties-master" className={`submenu-link ${pathname === "/parties-master" ? "active" : ""}`}><UserPlus size={18} />Parties Master</Link></li>
                            <li><Link to="/current-assets" className={`submenu-link ${pathname === "/current-assets" ? "active" : ""}`}><UserPlus size={18} />Current Assets</Link></li>
                            {!isElite && <li><Link to="/staff" className="submenu-link"><Users size={18} />Staff</Link></li>}
                        </ul>
                    )}


                    {/* <ul className="submenu">
                        <li>
                            <p className="section-sub-label">
                                <span className="section-icon"><FolderKanban size={20} /></span>
                                Transactions
                            </p>
                            <ul className="submenu">

                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Payment Entry</span>
                                    </Link>

                                </li>
                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Invoices</span>
                                    </Link>

                                </li>
                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Receipt Entry</span>
                                    </Link>

                                </li>
                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Investors</span>
                                    </Link>

                                </li>
                            </ul>
                            

                        </li>
                        <li>
                            <p className="section-label">
                                <span className="section-icon"><FolderKanban size={20} /></span>
                                REPORTS
                            </p>
                            <ul className="submenu">

                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Project Statement</span>
                                    </Link>

                                </li>
                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Statement of Account</span>
                                    </Link>

                                </li>
                                <li>
                                    <Link to="/income" className={`submenu-link ${pathname === "/income" ? "active" : ""}`}>
                                        <Receipt size={18} />
                                        <span>Balance Sheet</span>
                                    </Link>

                                </li>
                                
                            </ul>


                        </li>
                        

                        {!isElite && (
                            <li>
                                <Link to="/billing" className={`submenu-link ${pathname === "/billing" ? "active" : ""}`}>
                                    <Wallet size={18} />
                                    <span>Billing</span>
                                </Link>
                            </li>
                        )}
                    </ul> */}

                    {/* <p className="section-label">
                        <span className="section-icon"><ShieldUser size={20} /></span>
                        MASTERS
                    </p>

                    <ul className="submenu">
                        <li>
                            <Link to="/salesmen" className={`submenu-link ${pathname === "/salesmen" ? "active" : ""}`}>
                                <UserCog size={18} />
                                <span>Clients</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/investors" className={`submenu-link ${pathname === "/investors" ? "active" : ""}`}>
                                <Coins size={18} />
                                <span>Projects</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/clients" className={`submenu-link ${pathname === "/clients" ? "active" : ""}`}>
                                <Handshake size={18} />
                                <span>Salesman</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/others" className={`submenu-link ${pathname === "/others" ? "active" : ""}`}>
                                <UserPlus size={18} />
                                <span>Parties Master</span>
                            </Link>
                        </li>

                        {!isElite && (
                            <li>
                                <Link to="/staff" className={`submenu-link ${pathname === "/staff" ? "active" : ""}`}>
                                    <Users size={18} />
                                    <span>Staff</span>
                                </Link>
                            </li>
                        )}
                    </ul> */}

                    {!isElite && (
                        <>
                            <p className="section-label">
                                <span className="section-icon"><SlidersHorizontal size={20} /></span>
                                MASTER SETTINGS
                            </p>

                            <ul className="submenu">
                                <li>
                                    <Link to="/items" className={`submenu-link ${pathname === "/items" ? "active" : ""}`}>
                                        <Boxes size={18} />
                                        <span>Items</span>
                                    </Link>
                                </li>
                            </ul>
                        </>
                    )}
                    {!isElite && (
                        <li className="menu-section">
                            <Link to="/projects" className={`sidebar-link ${pathname === "/projects" ? "active" : ""}`}>
                                <ClipboardList size={20} />
                                <span>PROJECTS</span>
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
