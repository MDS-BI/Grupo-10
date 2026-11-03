# Plan de Implementación: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Rama**: `002-rrhh-planilla` | **Fecha**: 2026-11-02 | **Especificación**: [spec.md](spec.md)  
**Entrada**: Especificación de la funcionalidad desde `/specs/002-rrhh-planilla/spec.md`  
**Curso**: Modelación de Sistemas 2026-2 — DII Universidad de Concepción  
**Metodología**: Spec-Driven Development (SDD)

## Resumen

Construir un prototipo web interactivo del módulo de **Recursos Humanos y Planilla** sobre el módulo base de ERP. El módulo centraliza las fichas laborales, los contratos, las solicitudes de permiso, la asistencia, los beneficios, las evaluaciones de desempeño y la liquidación mensual de nómina. La aplicación se implementa con HTML, CSS y JavaScript vanilla sobre Vite, persiste los datos en `localStorage` y utiliza datos semilla con la estructura de las 14 entidades oficiales. La adaptación al dominio de RRHH se realiza en módulos de dominio (`src/hr/`) sin modificar el núcleo del módulo base.

El MVP prioriza los flujos P1: estructura organizacional, altas y contratos, permisos, nómina y control de acceso por roles. Los flujos P2 (asistencia, horas extras, beneficios y evaluaciones) completan el alcance y se integran en la misma aplicación.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022, HTML5, CSS3  
**Dependencias principales**: Vite, Vitest y jsdom; sin framework de interfaz pesado  
**Almacenamiento**: `localStorage` del navegador, con datos semilla en `src/data/seed.js`  
**Pruebas**: Vitest para pruebas unitarias y de integración con jsdom  
**Plataforma objetivo**: navegadores modernos de escritorio y móviles  
**Tipo de proyecto**: aplicación web de página única (SPA)  
**Objetivos de rendimiento**: interacciones fluidas con 500 empleados y 500 registros de asistencia; cálculo de nómina de 50 colaboradores en menos de 5 segundos  
**Restricciones**: sin backend, sin autenticación real, sin librerías pesadas; datos simulados y persistencia local  
**Escala/Alcance**: 14 entidades, 4 roles, 11 historias de usuario, aproximadamente 10 pantallas de dominio

## Verificación de la Constitución

*COMPROBACIÓN: debe pasar antes de la implementación y reverificarse al cierre de cada iteración.*

- **Calidad**: el código se organiza en módulos pequeños por dominio (`storage`, `auth`, `payroll`, componentes). Las reglas de negocio de RRHH quedan separadas de la capa de persistencia y del marco del módulo base.
- **Pruebas**: cada historia de usuario incluye pruebas unitarias de reglas y pruebas de integración de su flujo principal antes de considerarse terminada.
- **Experiencia de usuario**: se reutiliza el marco visual del módulo base; los formularios muestran validaciones claras, estados vacíos y mensajes de error recuperables.
- **Rendimiento y confiabilidad**: las listas y búsquedas se mantienen responsivas con 500 registros; la nómina se calcula en memoria y se persiste de forma atómica por período.
- **Seguridad y privacidad**: el acceso se controla por rol y los datos salariales, bancarios y médicos se ocultan a quien no corresponde.

No se identifican violaciones a la constitución. Las decisiones de simulación local y ausencia de backend están justificadas por el alcance académico del MVP.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-rrhh-planilla/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── hr-storage.md
├── checklists/
│   └── requirements.md
├── modelo-entidadrelacion.png
└── tasks.md
```

### Código fuente (raíz del repositorio)

```text
src/
├── main.js
├── app.js
├── styles.css
├── data/
│   └── seed.js
├── hr/
│   ├── storage.js
│   ├── auth.js
│   ├── payroll.js
│   └── components/
│       ├── shell.js
│       ├── dashboard.js
│       ├── departments.js
│       ├── positions.js
│       ├── employees.js
│       ├── contracts.js
│       ├── permissions.js
│       ├── attendance.js
│       ├── payroll-view.js
│       ├── benefits.js
│       └── evaluations.js

tests/
├── unit/
│   ├── hr-storage.test.js
│   ├── hr-auth.test.js
│   └── hr-payroll.test.js
└── integration/
    ├── departments.test.js
    ├── positions.test.js
    ├── employee-profile.test.js
    ├── contracts.test.js
    ├── permissions.test.js
    ├── attendance.test.js
    ├── payroll.test.js
    ├── rbac.test.js
    ├── overtime.test.js
    ├── benefits.test.js
    └── evaluations.test.js
```

**Decisión de estructura**: el módulo base (`001`) conserva su propia implementación y contrato de almacenamiento. El módulo de RRHH vive en `src/hr/` y reutiliza el marco, la navegación y los estilos del módulo base. Los datos semilla siguen la estructura de las 14 entidades oficiales para que la demo sea reconocible y las pruebas puedan construirse sobre datos realistas.

## Problema y Solución Propuesta

### Problema

La gestión de personal y el pago de sueldos se hacen hoy con planillas dispersas, lo que produce:

- Registros contractuales inconsistentes y desactualizados.
- Errores en el cálculo de haberes y deducciones mensuales.
- Falta de trazabilidad en la aprobación de vacaciones y licencias.
- Desconexión con la contabilidad y los centros de costo.

### Solución

Prototipo interactivo del módulo de **Recursos Humanos y Planilla**, construido sobre el modelo oficial de 14 entidades, que centraliza las fichas laborales, calcula la liquidación mensual y gestiona permisos, asistencia, beneficios y evaluaciones de forma trazable y segura.

## Arquitectura de Datos (14 entidades oficiales)

```text
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

**Compatibilidad con el ERP base**:

- `DEPARTAMENTOS.empresa_id` y `PERIODOS_NOMINA.empresa_id` → `companies.company_id`.
- `CONTRATOS_EMPLEADO.codigo_moneda` → `currencies.currency_code`.
- `DEPARTAMENTOS` → `cost_centers.department_id` (Finanzas) y el cierre de `PERIODOS_NOMINA` genera asientos en `journal_entries` (`source_module='payroll'`).
- `EMPLEADOS.empleado_id` es el maestro transversal usado por Ventas, Compras, Calidad y CRM.

El detalle de atributos, claves y relaciones está en [data-model.md](data-model.md) y en [modelo-entidadrelacion.png](modelo-entidadrelacion.png).

## Usuarios y Roles (RBAC)

| Rol | Entidades con acceso | Funciones | Privilegios |
|---|---|---|---|
| **Administrador de RRHH** | `DEPARTAMENTOS`, `CARGOS`, `EMPLEADOS`, `CONTRATOS_EMPLEADO`, `BENEFICIOS` | Altas/bajas, cargos, estructura contractual y beneficios. | Total sobre fichas de personal. |
| **Encargado de Nómina** | `PERIODOS_NOMINA`, `CONCEPTOS_NOMINA`, `LIQUIDACIONES`, `DETALLES_LIQUIDACION` | Configura haberes/deducciones, ejecuta la corrida mensual y emite papeletas. | Control de cálculos y cierres; sin acceso a datos médicos. |
| **Jefatura / Supervisor** | `SOLICITUDES_PERMISO`, `EVALUACIONES_DESEMPENO`, `REGISTROS_ASISTENCIA` | Visar permisos, evaluar desempeño y revisar asistencia del equipo directo. | Solo subordinados directos. **Sin visibilidad de `salario_base`**. |
| **Empleado (Autoservicio)** | `LIQUIDACIONES`, `SOLICITUDES_PERMISO`, `BENEFICIOS_EMPLEADO` | Ver sus papeletas y registrar solicitudes de ausencia. | Exclusivamente sus propios registros. |

## Alcance del MVP (Frontend HTML / CSS / JS)

Datos simulados en JSON con la misma estructura de las 14 entidades:

1. **Panel de RRHH:** KPIs de dotación activa, distribución por `DEPARTAMENTOS`, ausentismo desde `REGISTROS_ASISTENCIA` y costo consolidado de `PERIODOS_NOMINA`.
2. **Fichas y Contratos:** tabla filtrable por área y `CARGOS.nivel_grado`, con detalle de `CONTRATOS_EMPLEADO` (`tipo_contrato`, `salario_base`, vigencia).
3. **Simulador de Liquidación:** selección de empleado y `PERIODOS_NOMINA` para desglosar en vivo:
   `sueldo_liquido = total_haberes - sum(DETALLES_LIQUIDACION de deducciones)`,
   renderizando los renglones clasificados según `CONCEPTOS_NOMINA.tipo_concepto` (`haber` / `deduccion`).
4. **Gestión de Permisos:** formulario de autoservicio con `TIPOS_PERMISO` (`es_remunerado` y `dias_anuales`), saldo derivado, `dias_solicitados`, comentario de resolución y bandeja de aprobación de la jefatura sobre `SOLICITUDES_PERMISO.estado`, con validación de dotación mínima y bloqueo de autoaprobación.
5. **Asistencia y Horas Extras:** registro diario de entrada/salida, cálculo de horas y validación de horas extras por la jefatura directa.
6. **Beneficios y Desempeño:** catálogo de beneficios con estado y costo actualizable, inscripción con vigencia (activa/finalizada), baja y evaluaciones periódicas con calificación objetiva.

## Datos Sensibles y Mitigación de Sesgos

### Privacidad (PII)

- **Confidencialidad salarial:** `CONTRATOS_EMPLEADO.salario_base`, `LIQUIDACIONES.total_haberes` y `sueldo_liquido` son visibles solo para RRHH, Nómina y el propio empleado.
- **Datos de contacto:** `EMPLEADOS.correo_electronico` editable únicamente por el Administrador de RRHH; el empleado puede actualizar teléfono y dirección con validación.
- **Datos bancarios:** los cambios requieren solicitud y validación de RRHH, con registro de auditoría.
- **Ausencias médicas:** en `SOLICITUDES_PERMISO` se registra el tipo (`TIPOS_PERMISO`) y los días autorizados, **sin diagnósticos clínicos**.

### Sesgos

- **Equidad salarial:** `CARGOS.nivel_grado` permite comparar `salario_base` entre puestos equivalentes y detectar brechas injustificadas.
- **Objetividad en desempeño:** `EVALUACIONES_DESEMPENO.calificacion` usa escala cuantitativa (1.00–5.00) sobre metas acordadas, reduciendo la subjetividad del evaluador.
- **Trazabilidad:** las aprobaciones de permisos, reaperturas de nómina y cambios de rol dejan registro de quién, cuándo y por qué.

## Fases de Implementación

1. **Fase 0 — Fundacional:** estructura `src/hr`, datos semilla, almacenamiento, autenticación simulada y RBAC.
2. **Fase 1 — Organización y personal (HU1–HU4):** departamentos, cargos, ficha del empleado y contratos.
3. **Fase 2 — Permisos y asistencia (HU5–HU6, HU9):** solicitudes, aprobaciones, asistencia y horas extras.
4. **Fase 3 — Nómina (HU7):** períodos, conceptos, liquidaciones y papeletas.
5. **Fase 4 — Seguridad, beneficios y desempeño (HU8, HU10–HU11):** RBAC completo, beneficios y evaluaciones.
6. **Fase 5 — Integración y pulido:** panel de RRHH, accesibilidad, rendimiento con 500 registros, pruebas completas y demo.

Cada fase termina con su prueba independiente y con las tareas de `tasks.md` marcadas como completadas.

## Cronograma SDD

`plan.md` → `data-model.md` → `spec.md` → `tasks.md` → MVP

| Hito | Plazo | Entregables |
|---|---|---|
| **1. Borrador del Repositorio** | 20 de octubre | Modelo ER de las 14 entidades, imagen del diagrama y plan inicial. |
| **2. Especificación Funcional** | Fin de octubre | `spec.md` con historias de usuario y criterios Gherkin. |
| **3. Tareas Técnicas** | Principios de noviembre | `tasks.md` con tareas atómicas. |
| **4. Construcción del MVP** | Mediados de noviembre | Código funcional (HTML/CSS/JS) con datos mockeados. |
| **5. Entrega Final** | Semana del 30 de noviembre | Demo funcional (5 min), repositorio final y `README.md` completo. |

## Seguimiento de Complejidad

No se introdujeron violaciones a la constitución. La simulación de autenticación y la persistencia local son decisiones de alcance académico; el contrato de almacenamiento está aislado para permitir un backend futuro sin reescribir las reglas de negocio.

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| `localStorage` en lugar de backend | El MVP es una demo local sin infraestructura | Backend con base de datos: agrega complejidad innecesaria para el plazo |
| RBAC simulado en cliente | No hay autenticación real en el alcance | SSO/OAuth: fuera del alcance del curso |
| Cálculo de nómina en memoria | Los volúmenes de demo son pequeños | Motor de nómina en servidor: no aporta al objetivo de aprendizaje |
| Datos semilla en `src/data/seed.js` | Permite una demo reproducible | Carga manual de datos: dificulta pruebas y presentación |
