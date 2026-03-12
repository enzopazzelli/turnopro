"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  SmilePlus,
  Stethoscope,
  Scale,
  PawPrint,
  Brain,
  Calculator,
} from "lucide-react";

const profesiones = [
  {
    id: "odontologia",
    nombre: "Odontologia",
    icono: SmilePlus,
    color: "#06b6d4",
    features: [
      "Odontograma interactivo SVG",
      "Planes de tratamiento por etapas",
      "Historia clinica dental completa",
    ],
  },
  {
    id: "medicina",
    nombre: "Medicina",
    icono: Stethoscope,
    color: "#ef4444",
    features: [
      "Historia clinica con signos vitales",
      "Graficos de evolucion (Recharts)",
      "Recetas con impresion directa",
    ],
  },
  {
    id: "abogados",
    nombre: "Abogacia",
    icono: Scale,
    color: "#8b5cf6",
    features: [
      "Expedientes por cliente",
      "Repositorio de documentos",
      "Vencimientos legales con alertas",
    ],
  },
  {
    id: "veterinaria",
    nombre: "Veterinaria",
    icono: PawPrint,
    color: "#22c55e",
    features: [
      "Fichas de mascotas con foto",
      "Cartilla de vacunacion con alertas",
      "Historial clinico por mascota",
    ],
  },
  {
    id: "psicologia",
    nombre: "Psicologia",
    icono: Brain,
    color: "#f59e0b",
    features: [
      "Notas de sesion con estado emocional",
      "Linea de evolucion del paciente",
      "Cuestionarios PHQ-9 y GAD-7",
    ],
  },
  {
    id: "contadores",
    nombre: "Contaduria",
    icono: Calculator,
    color: "#3b82f6",
    features: [
      "Vencimientos fiscales automaticos",
      "Checklists de documentacion",
      "Seguimiento por obligacion tributaria",
    ],
  },
];

export function SelectorProfesion() {
  const [seleccionada, setSeleccionada] = useState("odontologia");

  const profesion = profesiones.find((p) => p.id === seleccionada);

  return (
    <div className="space-y-8">
      {/* Grid de cards clickeables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {profesiones.map((prof) => {
          const Icono = prof.icono;
          const activa = prof.id === seleccionada;
          return (
            <Card
              key={prof.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activa
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:ring-1 hover:ring-muted-foreground/20"
              }`}
              onClick={() => setSeleccionada(prof.id)}
            >
              <CardContent className="flex flex-col items-center gap-2 py-4 px-3">
                <Icono
                  className="h-8 w-8"
                  style={{ color: prof.color }}
                />
                <span className="text-sm font-medium text-center">
                  {prof.nombre}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features de la profesion seleccionada */}
      {profesion && (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">
            Funcionalidades para {profesion.nombre}
          </h3>
          <ul className="space-y-2 max-w-md mx-auto">
            {profesion.features.map((feat, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: profesion.color }}
                />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
