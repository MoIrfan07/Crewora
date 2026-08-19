// frontend/src/components/Topbar.tsx
import React from "react";
import "../styles/topbar.css";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar: React.FC = () => {
    const companyName = localStorage.getItem("companyName") || "Company";
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("companyName");
        // navigate (HashRouter automatically uses #/login)
        navigate("/login");
    };

    return (
        <div className="topbar-container">
            <div className="topbar-left">
                <h2 className="topbar-title">{companyName.toUpperCase()}</h2>
            </div>

            <div className="topbar-right">
                <div className="topbar-user">
                    <User size={20} className="topbar-icon" />
                    <span>
                        {companyName
                            .toLowerCase()
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </span>
                </div>

                <button className="topbar-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Topbar;
