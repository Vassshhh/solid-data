import React from "react";
import styles from "./Dashboard.module.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RoleCard from "./components/RoleCard";
import Chart from "./components/Chart";

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.cards}>
          <RoleCard title="Officer" value="$4644" code="#df3422f" />
          <RoleCard title="Medtion" value="$8421" />
        </div>
        <Chart />
      </div>
    </div>
  );
};

export default Dashboard;
