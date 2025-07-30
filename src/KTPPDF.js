// components/KTPPDF.js
import React from "react";
import FileListComponent from "./FileListComponent";

import {
  Page,
  Text,
  Image,
  Document,
  StyleSheet,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  section: { marginBottom: 10 },
  title: { fontSize: 18, marginBottom: 10 },
  image: {
    width: 180,
    height: 120,
    marginBottom: 10,
    objectFit: "contain",
    border: "1 solid #000",
  },
  label: { fontWeight: "bold" },
});

const getImageSrc = (base64) => {
  if (!base64) return null;
  const cleaned = base64.replace(/\s/g, "");

  if (cleaned.startsWith("iVBOR")) {
    return `data:image/png;base64,${cleaned}`;
  } else if (cleaned.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${cleaned}`;
  } else if (cleaned.startsWith("UklGR")) {
    return `data:image/webp;base64,${cleaned}`;
  } else {
    return `data:image/*;base64,${cleaned}`;
  }
};

const KTPPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Biodata Anggota</Text>
      {data.data ? (
        <Image style={styles.image} src={getImageSrc(data.data)} />
      ) : data.fallbackImage ? (
        <Image style={styles.image} src={data.fallbackImage} />
      ) : (
        <Text>Tidak ada foto KTP tersedia</Text>
      )}

      <View style={styles.section}>
        <Text>
          <Text style={styles.label}>NIK:</Text> {data.nik}
        </Text>
        <Text>
          <Text style={styles.label}>Nama Lengkap:</Text> {data.nama_lengkap}
        </Text>
        <Text>
          <Text style={styles.label}>Tempat Lahir:</Text>{" "}
          {data.tempat_lahir || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Tanggal Lahir:</Text>{" "}
          {data.tanggal_lahir || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Jenis Kelamin:</Text>{" "}
          {data.jenis_kelamin || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Alamat:</Text> {data.alamat || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>RT/RW:</Text> {data.rt_rw || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Kel/Desa:</Text> {data.kel_desa || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Kecamatan:</Text> {data.kecamatan || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Agama:</Text> {data.agama || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Status Perkawinan:</Text>{" "}
          {data.status_perkawinan || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Pekerjaan:</Text> {data.pekerjaan || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Kewarganegaraan:</Text>{" "}
          {data.kewarganegaraan || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>No HP:</Text> {data.no_hp || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Email:</Text> {data.email || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Berlaku Hingga:</Text>{" "}
          {data.berlaku_hingga || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Tanggal Pembuatan:</Text>{" "}
          {data.pembuatan || "-"}
        </Text>
        <Text>
          <Text style={styles.label}>Kota Pembuatan:</Text>{" "}
          {data.kota_pembuatan || "-"}
        </Text>
      </View>
    </Page>
  </Document>
);

export default KTPPDF;
