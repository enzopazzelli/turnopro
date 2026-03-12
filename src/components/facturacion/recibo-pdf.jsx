"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { LABELS_METODO_PAGO } from "@/lib/constants";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottom: "2px solid #333",
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: "right",
  },
  titulo: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  subtitulo: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
  },
  reciboNumero: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  reciboFecha: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginBottom: 8,
    borderBottom: "1px solid #ddd",
    paddingBottom: 4,
  },
  fila: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: "#666",
    fontSize: 10,
  },
  valor: {
    flex: 1,
    fontSize: 10,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderBottom: "1px solid #ddd",
  },
  tablaFila: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #eee",
  },
  tablaCol1: {
    flex: 3,
    fontSize: 10,
  },
  tablaCol2: {
    flex: 1,
    textAlign: "right",
    fontSize: 10,
  },
  tablaHeaderText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  totalBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f0f9f0",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  totalMonto: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: "1px solid #ddd",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
  },
});

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor);
}

function ReciboDocument({ datos, numeroRecibo, fechaEmision }) {
  const { tenant, paciente, pago, servicio, cita } = datos;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.titulo}>{tenant.nombre_negocio || tenant.nombre}</Text>
            {tenant.cuit && <Text style={styles.subtitulo}>CUIT: {tenant.cuit}</Text>}
            {tenant.direccion && <Text style={styles.subtitulo}>{tenant.direccion}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reciboNumero}>Recibo #{String(numeroRecibo).padStart(4, "0")}</Text>
            <Text style={styles.reciboFecha}>Fecha: {fechaEmision}</Text>
          </View>
        </View>

        {/* Datos del paciente */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos del cliente</Text>
          <View style={styles.fila}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.valor}>{paciente.nombre}</Text>
          </View>
          {paciente.dni && (
            <View style={styles.fila}>
              <Text style={styles.label}>DNI:</Text>
              <Text style={styles.valor}>{paciente.dni}</Text>
            </View>
          )}
          {paciente.direccion && (
            <View style={styles.fila}>
              <Text style={styles.label}>Direccion:</Text>
              <Text style={styles.valor}>{paciente.direccion}</Text>
            </View>
          )}
          {paciente.telefono && (
            <View style={styles.fila}>
              <Text style={styles.label}>Telefono:</Text>
              <Text style={styles.valor}>{paciente.telefono}</Text>
            </View>
          )}
        </View>

        {/* Detalle */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Detalle</Text>
          <View style={styles.tablaHeader}>
            <Text style={[styles.tablaCol1, styles.tablaHeaderText]}>Concepto</Text>
            <Text style={[styles.tablaCol2, styles.tablaHeaderText]}>Monto</Text>
          </View>
          <View style={styles.tablaFila}>
            <Text style={styles.tablaCol1}>
              {servicio ? servicio.nombre : "Pago"}
              {cita ? ` — Cita ${cita.fecha} ${cita.hora || ""}` : ""}
            </Text>
            <Text style={styles.tablaCol2}>{formatearPrecio(pago.monto)}</Text>
          </View>

          {/* Total */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL RECIBIDO</Text>
            <Text style={styles.totalMonto}>{formatearPrecio(pago.monto)}</Text>
          </View>
        </View>

        {/* Info de pago */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Informacion del pago</Text>
          <View style={styles.fila}>
            <Text style={styles.label}>Metodo de pago:</Text>
            <Text style={styles.valor}>
              {LABELS_METODO_PAGO[pago.metodo_pago] || pago.metodo_pago}
            </Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.label}>Fecha de pago:</Text>
            <Text style={styles.valor}>{pago.fecha_pago}</Text>
          </View>
          {pago.referencia && (
            <View style={styles.fila}>
              <Text style={styles.label}>Referencia:</Text>
              <Text style={styles.valor}>{pago.referencia}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento no fiscal — Generado por TurnoPro
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function descargarReciboPDF(recibo) {
  const { datos_recibo, numero_recibo, created_at } = recibo;

  const fechaEmision = created_at
    ? new Date(created_at).toLocaleDateString("es-AR")
    : new Date().toLocaleDateString("es-AR");

  const blob = await pdf(
    <ReciboDocument
      datos={datos_recibo}
      numeroRecibo={numero_recibo}
      fechaEmision={fechaEmision}
    />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recibo-${String(numero_recibo).padStart(4, "0")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
