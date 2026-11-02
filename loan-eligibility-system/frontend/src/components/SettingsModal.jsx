import React, { useState, useEffect } from "react";
import { changePassword, updateUserName } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "name",
  onProfileUpdated,
}) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // "name" | "password"

  // Edit User Name state
  const [fullName, setFullName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setNameSuccess("");
      setNameError("");
      setPwdSuccess("");
      setPwdError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Read current name from user context or localStorage
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setFullName(parsed.full_name || "");
        } else if (user?.full_name) {
          setFullName(user.full_name);
        }
      } catch (e) {
        setFullName(user?.full_name || "");
      }
    }
  }, [isOpen, initialTab, user]);

  if (!isOpen) return null;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");

    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError("Please enter a valid user name.");
      return;
    }

    setNameLoading(true);
    try {
      await updateUserName(trimmed);
      if (updateUser) {
        updateUser({ full_name: trimmed });
      }
      if (onProfileUpdated) {
        onProfileUpdated(trimmed);
      }
      // Close settings modal window immediately upon saving
      onClose();
    } catch (err) {
      console.error("Failed to update user name:", err);
      setNameError(err?.response?.data?.detail || "Could not update user name. Please try again.");
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword) {
      setPwdError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPwdError("New password must be different from current password.");
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Close settings modal window immediately upon saving
      onClose();
    } catch (err) {
      console.error("Failed to change password:", err);
      setPwdError(err?.response?.data?.detail || "Could not change password. Please check your current password.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="settings-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>⚙️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0b1f33" }}>
                Account Settings
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                Manage your credentials and dashboard profile
              </p>
            </div>
          </div>
          <button
            type="button"
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection: Change Password & Edit User Name */}
        <div className="settings-modal-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "name" ? "active" : ""}`}
            onClick={() => setActiveTab("name")}
          >
            <span>✏️</span> Edit User Name
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <span>🔑</span> Change Password
          </button>
        </div>

        {/* Content Body */}
        <div className="settings-modal-body">
          {/* TAB 1: Edit User Name */}
          {activeTab === "name" && (
            <form onSubmit={handleUpdateName} className="settings-form">
              <div className="settings-info-box">
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.45 }}>
                  This name is displayed right after <strong>Welcome, ...!</strong> on your dashboard greeting and on official bank communications.
                </p>
              </div>

              {nameSuccess && (
                <div className="settings-alert settings-alert-success">
                  <span>✔</span> {nameSuccess}
                </div>
              )}
              {nameError && (
                <div className="settings-alert settings-alert-error">
                  <span>⚠</span> {nameError}
                </div>
              )}

              <div className="settings-field">
                <label htmlFor="settings-full-name">User Name (Full Name)</label>
                <input
                  id="settings-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. David Miller"
                  required
                  autoFocus
                />
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={nameLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={nameLoading}
                  style={{ minWidth: "120px" }}
                >
                  {nameLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="settings-info-box">
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.45 }}>
                  Choose a secure password of at least 6 characters. You will need your current password to confirm the change.
                </p>
              </div>

              {pwdSuccess && (
                <div className="settings-alert settings-alert-success">
                  <span>✔</span> {pwdSuccess}
                </div>
              )}
              {pwdError && (
                <div className="settings-alert settings-alert-error">
                  <span>⚠</span> {pwdError}
                </div>
              )}

              <div className="settings-field">
                <label htmlFor="current-pwd">Current Password</label>
                <input
                  id="current-pwd"
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  autoFocus
                />
              </div>

              <div className="settings-field">
                <label htmlFor="new-pwd">New Password</label>
                <input
                  id="new-pwd"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="settings-field">
                <label htmlFor="confirm-pwd">Confirm New Password</label>
                <input
                  id="confirm-pwd"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "-0.25rem" }}>
                <input
                  type="checkbox"
                  id="toggle-show-pwd"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label
                  htmlFor="toggle-show-pwd"
                  style={{ fontSize: "0.83rem", color: "#64748b", cursor: "pointer", userSelect: "none" }}
                >
                  Show passwords
                </label>
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={pwdLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={pwdLoading}
                  style={{ minWidth: "150px" }}
                >
                  {pwdLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

