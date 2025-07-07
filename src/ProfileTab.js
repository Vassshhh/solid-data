import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileTab.module.css";

const ProfileTab = () => {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState({});
  const [profileTemp, setProfileTemp] = useState({});

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
    const dummyProfile = {
      username: "admin",
    };

    setProfile(dummyProfile);
    setProfileTemp(dummyProfile);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!profile.oldPassword || !profile.newPassword) {
        alert("Password lama dan baru tidak boleh kosong.");
        return;
      }

      const payload = {
        username: profile.username,
        oldPassword: profile.oldPassword,
        newPassword: profile.newPassword,
      };

      const response = await fetch(
        "https://bot.kediritechnopark.com/webhook/reset-password/psi",
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
    setProfile(profileTemp);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <div className={styles.logoAndTitle}>
          <img src="/PSI.png" alt="Profile Avatar" />
          <h1 className={styles.h1}>Kawal PSI Profile</h1>
        </div>

        <div className={styles.dropdownContainer} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={styles.dropdownToggle}
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
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMenuOpen(false);
                }}
                className={styles.dropdownItem}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className={styles.dropdownItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.profileSection}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Account</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.editButton}
                >
                  Change Password
                </button>
              ) : (
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCancel}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button onClick={handleSave} className={styles.saveButton}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className={styles.profileForm}>
              {!isEditing && (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={profile.username}
                    className={`${styles.input} ${
                      !isEditing ? styles.readOnly : ""
                    }`}
                    disabled
                  />
                </div>
              )}

              {isEditing && (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Enter new password"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        © 2025 Kediri Technopark • Dermalounge AI Admin
      </div>
    </div>
  );
};

export default ProfileTab;
