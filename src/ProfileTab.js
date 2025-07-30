import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dashboardStyles from "./Dashboard.module.css";
import profileStyles from "./ProfileTab.module.css";

const ProfileTab = () => {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState({});
  const [userTemp, setUserTemp] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  useEffect(() => {
    const verifyTokenAndFetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(
          "https://bot.kediritechnopark.com/webhook/solid-data/dashboard",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data[0].username) {
          throw new Error("Unauthorized");
        }

        setUser(data[0]);
        setUserTemp(data[0]);
      } catch (error) {
        console.error("Token tidak valid:", error.message);
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    };

    verifyTokenAndFetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!user.oldPassword || !user.newPassword) {
        alert("Password lama dan baru tidak boleh kosong.");
        return;
      }

      const payload = {
        username: user.username,
        oldPassword: user.oldPassword,
        newPassword: user.newPassword,
      };

      const response = await fetch(
        "https://bot.kediritechnopark.com/webhook/solid-data/reset-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Gagal menyimpan profil");

      alert("Berhasil mengubah password");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saat menyimpan profil:", error);
      alert("Terjadi kesalahan saat menyimpan profil.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUser(userTemp);
  };

  return (
    <div className={dashboardStyles.dashboardContainer}>
      <div className={dashboardStyles.dashboardHeader}>
        <div className={dashboardStyles.logoAndTitle}>
          <img src="/ikasapta.png" alt="Bot Avatar" />
          <h1 className={dashboardStyles.h1}>SOLID</h1>
          <h1 className={dashboardStyles.h1} styles="color: #43a0a7;">
            DATA
          </h1>
        </div>

        <div className={dashboardStyles.dropdownContainer} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={dashboardStyles.dropdownToggle}
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-haspopup="true"
          >
            <svg
              width="15"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className={dashboardStyles.dropdownMenu}>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMenuOpen(false);
                }}
                className={dashboardStyles.dropdownItem}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate("/scan");
                  setIsMenuOpen(false);
                }}
                className={dashboardStyles.dropdownItem}
              >
                Scan
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className={dashboardStyles.dropdownItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={profileStyles.mainContent}>
        <div className={profileStyles.profileSection}>
          <div className={profileStyles.profileCard}>
            <div className={profileStyles.profileHeader}>
              <h2>Account</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={profileStyles.editButton}
                >
                  Change Password
                </button>
              ) : (
                <div className={profileStyles.actionButtons}>
                  <button
                    onClick={handleCancel}
                    className={profileStyles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button onClick={handleSave} className={profileStyles.saveButton}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className={profileStyles.profileForm}>
              {!isEditing && (
                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={user.username}
                    className={`${profileStyles.input} ${
                      !isEditing ? profileStyles.readOnly : ""
                    }`}
                    disabled
                  />
                </div>
              )}

              {isEditing && (
                <>
                  <div className={profileStyles.inputGroup}>
                    <label className={profileStyles.inputLabel}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      onChange={handleChange}
                      className={profileStyles.input}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className={profileStyles.inputGroup}>
                    <label className={profileStyles.inputLabel}>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      onChange={handleChange}
                      className={profileStyles.input}
                      placeholder="Enter new password"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={dashboardStyles.footer}>
        © 2025 Kediri Technopark • Dashboard SOLID DATA
      </div>
    </div>
  );
};

export default ProfileTab;
