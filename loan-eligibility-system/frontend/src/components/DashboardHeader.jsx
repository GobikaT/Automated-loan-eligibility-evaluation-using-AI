import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SettingsModal from "./SettingsModal";

const ROLE_HOME = {
  APPLICANT: "/applicant/dashboard",
  MANAGER: "/manager/dashboard",
  ADMIN: "/admin/dashboard",
};

/**
 * Consistent header for every authenticated dashboard (Applicant/Manager/Admin).
 * Features brand identity, role navigation, and profile menu with Settings & Logout.
 */
export default function DashboardHeader({ links = [], initials = "U" }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("name"); // "name" | "password"
  const [displayInitials, setDisplayInitials] = useState(initials);
  const menuRef = useRef(null);

  // My Application is ONLY visible to Applicant (never to Admin or Manager)
  const currentRole = (role || user?.role || localStorage.getItem("role") || "").toUpperCase();
  const isManagerOrAdmin =
    currentRole === "MANAGER" ||
    currentRole === "ADMIN" ||
    window.location.pathname.includes("/manager") ||
    window.location.pathname.includes("/admin");
  const isApplicant =
    !isManagerOrAdmin &&
    (currentRole === "APPLICANT" || window.location.pathname.includes("/applicant"));

  useEffect(() => {
    setDisplayInitials(initials);
  }, [initials]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const u = localStorage.getItem("user");
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed.full_name) {
            setDisplayInitials(parsed.full_name.trim().charAt(0).toUpperCase() || "U");
          }
        }
      } catch (e) {}
    };
    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setSettingsSubmenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openSettings = (tab = "name") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
    setMenuOpen(false);
    setSettingsSubmenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left" style={{ marginLeft: "clamp(1.5rem, 3.5vw, 3rem)" }}>
          <Link
            to={ROLE_HOME[role] || "/"}
            className="navbar-brand"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #163a5c 0%, #0b1f33 100%)",
                border: "1.5px solid #d4af37",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2)",
                flexShrink: 0,
              }}
            >
              🏛️
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Newsreader', Georgia, serif)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--ink-900, #0b1f33)",
                  letterSpacing: "0.02em",
                  lineHeight: 1.15,
                }}
              >
                Meridian Trust Bank
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#b4883a",
                  marginTop: "2px",
                }}
              >
                ESTD 1924 &bull; SECURE DIGITAL BANKING
              </span>
            </div>
          </Link>
          <div className="navbar-links">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        </div>

        <div className="navbar-right" style={{ marginRight: "clamp(1rem, 2.5vw, 2rem)" }}>
          <button className="icon-btn" aria-label="Notifications" title="Notifications">
            🔔
            <span className="notif-dot" />
          </button>

          <div className="profile-menu-wrap" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => {
                setMenuOpen((v) => !v);
                setSettingsSubmenuOpen(false);
              }}
              aria-label="Profile menu"
            >
              {displayInitials}
            </button>

            {menuOpen && (
              <div className="profile-dropdown">
                {/* My Application option: ONLY visible to Applicant */}
                {isApplicant && (
                  <Link
                    to="/applicant/tracking"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setSettingsSubmenuOpen(false);
                    }}
                  >
                    My Application
                  </Link>
                )}

                {/* Settings option for EVERY user */}
                <div className="profile-dropdown-group">
                  <button
                    type="button"
                    className={`profile-dropdown-item settings-trigger-btn ${settingsSubmenuOpen ? "active" : ""}`}
                    onClick={() => setSettingsSubmenuOpen((v) => !v)}
                    title="Account Settings"
                  >
                    <span>Settings</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        transform: settingsSubmenuOpen ? "rotate(90deg)" : "none",
                        transition: "transform 0.18s ease",
                        color: "#94a3b8",
                      }}
                    >
                      ▶
                    </span>
                  </button>

                  {/* Two options shown when touching / clicking Settings */}
                  {settingsSubmenuOpen && (
                    <div className="profile-submenu-panel">
                      <button
                        type="button"
                        className="profile-dropdown-subitem"
                        onClick={() => openSettings("name")}
                      >
                        Edit User Name
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-subitem"
                        onClick={() => openSettings("password")}
                      >
                        Change Password
                      </button>
                    </div>
                  )}
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Settings Modal: Change Password & Edit User Name */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
        onProfileUpdated={(newName) => {
          if (newName) {
            setDisplayInitials(newName.trim().charAt(0).toUpperCase() || "U");
          }
        }}
      />
    </>
  );
}
