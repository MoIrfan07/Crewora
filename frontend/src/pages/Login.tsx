import React, { useState } from "react";
import axios from "axios";
import "../styles/Login.css";
import bg from "../assets/Login-Container-Background.jpg";
import { useNavigate } from "react-router-dom";


const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const handleLogin = async () => {
        try {
            const res = await axios.post(
                "http://localhost:5000/api/login",
                { username, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                // localStorage.setItem("companyName", res.data.companyName);
                // window.location.href = "/dashboard";
                localStorage.setItem("companyName", res.data.companyName);
                navigate("/dashboard"); // HashRouter will produce #/dashboard

            }
            else {
                alert("Invalid username or password");
            }
        } catch (err) {
            alert("Server error");
        }
    };

    return (
        <div className="login-container">
            <img src={bg} className="login-background-image" />

            <div className="login-card">
                <h1 className="login-title">
                    {username ? username.toUpperCase() : "CREWORA LOGIN"}
                </h1>

                <input
                    type="text"
                    placeholder="Username"
                    className="login-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="login-btn" onClick={handleLogin}>
                    Login
                </button>

                <p className="login-footer">© Crewora | Manpower Management</p>
            </div>
        </div>
    );
};

export default Login;
