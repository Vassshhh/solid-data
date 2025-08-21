import React, { useState, useEffect } from "react";
import {
  User, Eye, EyeOff, Plus, X, RefreshCw, FileText, Users, Baby, Settings, LogOut, Camera
} from "lucide-react";
import styles from "./Login.module.css";

/* ===========================================================
   LOGIN PAGE
   =========================================================== */
export default function LoginPage({ onLoggedIn }) {

  const login = () => {
    const baseUrl = "http://localhost:3001/";
    const modal = "product";
    const productId = 9;

    const authorizedUri = "http://localhost:3000/dashboard?token=";
    const unauthorizedUri = `${baseUrl}?modal=${modal}&product_id=${productId}`;

    const url =
      `${baseUrl}?modal=${modal}&product_id=${productId}` +
      `&authorized_uri=${encodeURIComponent(authorizedUri)}` +
      `&unauthorized_uri=${encodeURIComponent(unauthorizedUri)}`;

    window.location.href = url;
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Logo/Brand */}

        {/* Login Form */}
        <div className={styles.loginForm}>

        <div className={styles.brandSection}>
          <div className={styles.logoIcon}>
            <FileText className={styles.logoIconSvg} />
          </div>
          <h1 className={styles.brandTitle}>SOLID DATA</h1>
          <p className={styles.brandSubtitle}>Kelola data dokumen Anda dengan mudah</p>
        </div>
          <button
            className={styles.loginButton}
            onClick={login}
          >
           Masuk
          </button>
        </div>
      </div>
    </div>
  );
}