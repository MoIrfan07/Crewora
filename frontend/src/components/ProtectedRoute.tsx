// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

/**
 * ProtectedRoute
 *
 * Strategy:
 * 1. If localStorage has a login marker (companyName), treat as authenticated immediately (fast).
 * 2. Attempt a backend session validation (if backend reachable).
 * 3. If backend confirms loggedIn -> allow.
 *    If backend denies or errors -> fall back to localStorage decision (so offline still works).
 *
 * This is a pragmatic pattern for offline Electron apps that may sometimes be online.
 */

const checkLocalAuth = () => {
    // adapt this key to whatever you store on login
    return !!localStorage.getItem("companyName");
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;

        // fast local check
        const localAuth = checkLocalAuth();
        if (localAuth) {
            if (mounted) {
                setLoggedIn(true);
                // still attempt to validate with backend, but don't block UI
                setLoading(true);
            }
        } else {
            // no local marker -> show loading and call backend
            setLoading(true);
        }

        // attempt backend validation but do not force logout if backend fails
        axios
            .get("http://localhost:5000/api/user/session", { withCredentials: true, timeout: 3000 })
            .then((res) => {
                if (!mounted) return;
                // expect { loggedIn: boolean } from your server
                const serverOk = !!res?.data?.loggedIn;
                setLoggedIn(serverOk || localAuth); // if server says true OR local marker exists
            })
            .catch(() => {
                if (!mounted) return;
                // backend unreachable or returned error → rely on local marker (offline case)
                setLoggedIn(localAuth);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        // lightweight loading UI — you can replace this with a spinner/component
        return <div style={{ padding: 24 }}>Loading…</div>;
    }

    if (!loggedIn) {
        // use replace to avoid back-button weirdness
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
