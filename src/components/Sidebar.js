// Sidebar.js
import React from "react";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>Dashboard</div>
      <div className={styles.menu}>
        <div className={styles.menuItem}>Officers</div>
        <div className={styles.menuItem}>Roles</div>
        <div className={styles.menuItem}>Key Performances</div>
      </div>
    </div>
  );
};

export default Sidebar;
