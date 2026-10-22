# Plan de Trabajo: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Curso:** Modelación de Sistemas 2026-2 — DII Universidad de Concepción  
**Metodología:** Spec-Driven Development (SDD)  
**Modelo de Datos:** 14 entidades oficiales (`data-model.md` / `modelo-entidadrelacion.png`)

---

## 1. Problema y Solución Propuesta

### Problema
La gestión de personal y el pago de sueldos se hacen hoy con planillas dispersas, lo que produce:
- Registros contractuales inconsistentes y desactualizados.
- Errores en el cálculo de haberes y deducciones mensuales.
- Sin trazabilidad en la aprobación de vacaciones y licencias.
- Desconexión con la contabilidad y los centros de costo.

### Solución
Prototipo interactivo del módulo de **Recursos Humanos y Planilla**, construido sobre el modelo oficial de 14 entidades, que centraliza las fichas laborales, automatiza la liquidación mensual y gestiona permisos de forma trazable y segura.

---

## 2. Arquitectura de Datos (14 entidades oficiales)

```
┌─────────────────────────────────────────────────────────────────────────┐
│            MÓDULO DE RECURSOS HUMANOS Y PLANILLA (14 ENTIDADES)         │
├──────────────────────┬──────────────────────────────────────────────────┤
│ 1. Organización      │ • DEPARTAMENTOS      • CARGOS                   │
│    y Personal        │ • EMPLEADOS          • CONTRATOS_EMPLEADO        │
├──────────────────────┼──────────────────────────────────────────────────┤
│ 2. Asistencia        │ • REGISTROS_ASISTENCIA • TIPOS_PERMISO          │
│    y Permisos        │ • SOLICITUDES_PERMISO                           │
├──────────────────────┼──────────────────────────────────────────────────┤
│ 3. Motor de Nómina   │ • PERIODOS_NOMINA     • CONCEPTOS_NOMINA        │
│                      │ • LIQUIDACIONES       • DETALLES_LIQUIDACION    │
├──────────────────────┼──────────────────────────────────────────────────┤
│ 4. Beneficios y      │ • BENEFICIOS          • BENEFICIOS_EMPLEADO     │
│    Desempeño         │ • EVALUACIONES_DESEMPENO                        │
└──────────────────────┴──────────────────────────────────────────────────┘
```

**Compatibilidad con el ERP base** (`erp_data_model.md`):
- `DEPARTAMENTOS.empresa_id` y `PERIODOS_NOMINA.empresa_id` → `companies.company_id`.
- `CONTRATOS_EMPLEADO.codigo_moneda` → `currencies.currency_code`.
- `DEPARTAMENTOS` → `cost_centers.department_id` (Finanzas) y el cierre de `PERIODOS_NOMINA` genera asientos en `journal_entries` (`source_module='payroll'`).
- `EMPLEADOS.empleado_id` es el maestro transversal usado por Ventas, Compras, Calidad y CRM.

---

## 3. Usuarios y Roles (RBAC)

| Rol | Entidades con acceso | Responsabilidades | Privilegios |
|---|---|---|---|
| **Administrador de RRHH** | `DEPARTAMENTOS`, `CARGOS`, `EMPLEADOS`, `CONTRATOS_EMPLEADO`, `BENEFICIOS` | Altas/bajas, cargos, estructura contractual y beneficios. | Total sobre fichas de personal. |
| **Encargado de Nómina** | `PERIODOS_NOMINA`, `CONCEPTOS_NOMINA`, `LIQUIDACIONES`, `DETALLES_LIQUIDACION` | Configura haberes/deducciones, ejecuta la corrida mensual y emite papeletas. | Control de cálculos y cierres; sin acceso a datos médicos. |
| **Jefatura / Supervisor** | `SOLICITUDES_PERMISO`, `EVALUACIONES_DESEMPENO`, `REGISTROS_ASISTENCIA` | Visar permisos, evaluar desempeño y revisar asistencia del equipo directo. | Solo subordinados directos. **Sin visibilidad de `salario_base`**. |
| **Empleado (Autoservicio)** | `LIQUIDACIONES`, `SOLICITUDES_PERMISO`, `BENEFICIOS_EMPLEADO` | Ver sus papeletas y registrar solicitudes de ausencia. | Exclusivamente sus propios registros. |

---

## 4. Alcance del MVP (Frontend HTML / CSS / JS)

Datos simulados en JSON con la misma estructura de las 14 entidades:

1. **Dashboard:** KPIs derivados de `EMPLEADOS` (dotación activa, distribución por `DEPARTAMENTOS`), ausentismo desde `REGISTROS_ASISTENCIA` y costo consolidado de `PERIODOS_NOMINA`.
2. **Fichas y Contratos:** Tabla filtrable por área y `CARGOS.nivel_grado`, con detalle de `CONTRATOS_EMPLEADO` (`tipo_contrato`, `salario_base`, vigencia).
3. **Simulador de Liquidación:** Selección de empleado y `PERIODOS_NOMINA` para desglosar en vivo:
   $$\text{sueldo\_liquido} = \text{total\_haberes} - \sum \text{DETALLES\_LIQUIDACION (deducciones)}$$
   renderizando los renglones clasificados según `CONCEPTOS_NOMINA.tipo_concepto` (`haber` / `deduccion`).
4. **Gestión de Permisos:** Formulario de autoservicio con `TIPOS_PERMISO` (incluido `es_remunerado`) y bandeja de aprobación de la jefatura sobre `SOLICITUDES_PERMISO.estado`.

---

## 5. Datos Sensibles y Mitigación de Sesgos

### 5.1 Privacidad (PII)
- **Confidencialidad salarial:** `CONTRATOS_EMPLEADO.salario_base`, `LIQUIDACIONES.total_haberes` y `sueldo_liquido` son visibles solo para RRHH, Nómina y el propio empleado.
- **Datos de contacto:** `EMPLEADOS.correo_electronico` editable únicamente por el Administrador de RRHH.
- **Ausencias médicas:** en `SOLICITUDES_PERMISO` se registra el tipo (`TIPOS_PERMISO`) y los días autorizados, **sin diagnósticos clínicos**.

### 5.2 Sesgos
- **Equidad salarial:** `CARGOS.nivel_grado` permite comparar `salario_base` entre puestos equivalentes y detectar brechas injustificadas por género o edad.
- **Objetividad en desempeño:** `EVALUACIONES_DESEMPENO.calificacion` usa escala cuantitativa (1.00–5.00) sobre metas acordadas, reduciendo la subjetividad del evaluador.

---

## 6. Cronograma SDD

$$\text{plan.md} \rightarrow \text{data-model.md} \rightarrow \text{specs.md} \rightarrow \text{tasks.md} \rightarrow \text{MVP}$$

| Hito | Plazo | Entregables |
|---|---|---|
| **1. Borrador del Repositorio** | **20 de Octubre** | Modelo ER de las 14 entidades, imagen del diagrama y `plan.md`. |
| **2. Especificación Funcional** | Fin de Octubre | `specs.md` con historias de usuario y criterios Gherkin. |
| **3. Tareas Técnicas** | Principios de Noviembre | `tasks.md` con tareas atómicas del frontend. |
| **4. Construcción del MVP** | Mediados de Noviembre | Código funcional (HTML/CSS/JS) con datos mockeados. |
| **5. Entrega Final** | **Semana 30 de Noviembre** | Demo funcional (5 min) y repositorio final con `README.md`. |
