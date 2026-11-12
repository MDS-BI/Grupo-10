# Grupo-10 — Módulo de Recursos Humanos y Planilla (ERP)

## Descripción

Una empresa busca diseñar una base de datos relacional para gestionar la información de su personal y la administración de recursos humanos. Por cada empleado se registra un RUT único, nombres, correo electrónico, fecha de contratación y estado laboral, además de asociarlo a un departamento específico, un cargo y, en caso de corresponder, a un supervisor directo dentro de la misma organización. A su vez, el sistema permite registrar los contratos laborales vigentes, detallando el tipo de contrato, fechas de inicio y término, salario base y la forma de pago en que se pacta la remuneración.

Por otra parte, el sistema administra las actividades y beneficios vinculados a cada trabajador durante su permanencia en la empresa. Se gestionan las solicitudes y tipos de permisos laborales con sus respectivas aprobaciones, el registro diario de asistencia con horas trabajadas, y las evaluaciones periódicas de desempeño asignadas a evaluadores específicos. Finalmente, el módulo controla la ejecución de nóminas de pago, desglosando los sueldos brutos y netos mediante conceptos de ingresos y deducciones, así como la inscripción de los empleados en los distintos planes de beneficios ofrecidos en la empresa.

## Problema

La gestión de personal y el pago de sueldos se realizan con planillas dispersas, lo que genera registros contractuales inconsistentes, errores en el cálculo de haberes y deducciones, falta de trazabilidad en la aprobación de permisos y desconexión con la contabilidad y los centros de costo.

## Solución

Prototipo web interactivo del módulo de **Recursos Humanos y Planilla**, construido sobre el modelo oficial de 14 entidades del ERP. Centraliza las fichas laborales, los contratos, los permisos, la asistencia, los beneficios, las evaluaciones de desempeño y la liquidación mensual de nómina, con control de acceso por roles y protección de datos sensibles.

## Funcionalidades principales

- Gestión de departamentos y catálogo de cargos con niveles de grado.
- Fichas de empleados con RUT único, datos de contacto y bancarios, departamento, cargo y supervisor.
- Contratos laborales con tipo, vigencia, salario base y moneda.
- Solicitudes de permiso con flujo de aprobación, saldo y dotación mínima.
- Registro diario de asistencia y cálculo de horas trabajadas.
- Validación de horas extras por la jefatura directa.
- Períodos, conceptos y liquidaciones de nómina con desglose de haberes y deducciones.
- Catálogo de beneficios e inscripción de colaboradores.
- Evaluaciones periódicas de desempeño con calificación objetiva.
- Control de acceso basado en roles (RBAC) y auditoría de acciones sensibles.
- Panel con indicadores de dotación, ausentismo y costo de nómina.

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Interfaz | HTML5, CSS3 y JavaScript ES2022 |
| Build y desarrollo | Vite |
| Pruebas | Vitest y jsdom |
| Persistencia | `localStorage` del navegador |
| Datos de demo | JSON semilla con las 14 entidades |

## Estructura del repositorio

```text
Grupo-10/
├── README.md
├── feedback.md
├── package.json
├── specs/
│   ├── 001-erp-base-module/     # Módulo base reutilizable
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── data-model.md
│   │   ├── tasks.md
│   │   ├── research.md
│   │   ├── quickstart.md
│   │   ├── contracts/
│   │   └── checklists/
│   └── 002-rrhh-planilla/       # Módulo de RRHH y Planilla
│       ├── spec.md
│       ├── plan.md
│       ├── data-model.md
│       ├── tasks.md
│       ├── research.md
│       ├── quickstart.md
│       ├── modelo-entidadrelacion.png
│       ├── contracts/
│       └── checklists/
├── src/                         # Implementación funcional del módulo 002
│   ├── app.js                   # Arranque, login demo y ruteo por hash
│   ├── styles.css
│   ├── data/seed.js             # Semilla de las 14 entidades y usuarios demo
│   └── hr/
│       ├── storage.js           # Persistencia en localStorage
│       ├── auth.js              # Sesión simulada y RBAC
│       ├── rules.js             # Validaciones y reglas de negocio
│       ├── payroll.js           # Motor de liquidación
│       ├── audit.js             # Trazabilidad de acciones sensibles
│       └── components/          # Vistas de cada historia de usuario
└── tests/
    ├── unit/
    └── integration/
```

## Modelo de datos

El módulo trabaja con 14 entidades oficiales y tablas de apoyo (`SOLICITUDES_BANCARIAS`, auditoría y sesión):

| Área | Entidades |
|---|---|
| Organización y personal | `DEPARTAMENTOS`, `CARGOS`, `EMPLEADOS`, `CONTRATOS_EMPLEADO` |
| Asistencia y permisos | `REGISTROS_ASISTENCIA`, `TIPOS_PERMISO`, `SOLICITUDES_PERMISO` |
| Motor de nómina | `PERIODOS_NOMINA`, `CONCEPTOS_NOMINA`, `LIQUIDACIONES`, `DETALLES_LIQUIDACION` |
| Beneficios y desempeño | `BENEFICIOS`, `BENEFICIOS_EMPLEADO`, `EVALUACIONES_DESEMPENO` |

El diagrama y el diccionario de datos están en [`specs/002-rrhh-planilla/data-model.md`](specs/002-rrhh-planilla/data-model.md) y [`modelo-entidadrelacion.png`](specs/002-rrhh-planilla/modelo-entidadrelacion.png).

## Roles del sistema

| Rol | Alcance |
|---|---|
| Administrador de RRHH | Departamentos, cargos, empleados, contratos y beneficios. |
| Encargado de Nómina | Períodos, conceptos, liquidaciones y papeletas. |
| Jefatura / Supervisor | Permisos, asistencia y evaluaciones de sus subordinados directos. |
| Empleado | Sus propios datos, solicitudes, papeletas y evaluaciones. |

### Usuarios demo

El ingreso no usa contraseña: se selecciona uno de los perfiles disponibles. Los roles y el alcance se aplican de inmediato y los cambios de rol se reflejan en el siguiente inicio de sesión.

| Usuario demo | Rol | Nombre |
|---|---|---|
| `ana.torres` | Administrador de RRHH | Ana Torres |
| `diego.soto` | Encargado de Nómina | Diego Soto |
| `gonzalo.paredes` | Jefatura / Supervisor | Gonzalo Paredes |
| `javiera.nunez` | Empleado | Javiera Núñez |

La información se guarda en `localStorage`. El botón **Restablecer demo** vuelve a cargar la semilla original.

## Metodología

El proyecto sigue **Spec-Driven Development (SDD)** con Speckit:

1. `spec.md`: historias de usuario, requisitos y criterios de éxito.
2. `plan.md`: contexto técnico, arquitectura y fases.
3. `data-model.md`: entidades, relaciones y reglas de integridad.
4. `tasks.md`: tareas atómicas y pruebas.
5. Implementación incremental con retorno al spec cuando cambia el alcance.

Las tareas técnicas están trazadas en `tasks.md`.

## Requisitos

- Node.js 20.19 o superior (recomendado Node.js 22 LTS).
- npm 10 o superior.
- Navegador moderno (Chrome, Edge o Firefox).

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

La aplicación se abre en la URL local que entrega Vite (por defecto `http://localhost:5173`). Desde la pantalla de ingreso se elige uno de los cuatro perfiles demo.

> **Estado**: MVP funcional. La aplicación incluye navegación, datos semilla, persistencia local, control de acceso por roles, auditoría y pruebas automatizadas. Las especificaciones del módulo base `001` se conservan sin modificaciones.

## Pruebas

```bash
npm test
```

La suite considera pruebas unitarias de reglas de negocio y pruebas de integración de los flujos de cada historia de usuario. Al cierre de esta entrega se ejecutan **63 pruebas** sobre 15 archivos.

```bash
npm run build
npm run preview
```

`npm run build` valida el empaquetado de producción y `npm run preview` sirve el resultado compilado.

## Demostración

El flujo sugerido para la demo está en [`specs/002-rrhh-planilla/quickstart.md`](specs/002-rrhh-planilla/quickstart.md). Incluye la creación de estructura organizacional, el alta de un colaborador, la aprobación de permisos, el registro de asistencia, la liquidación de nómina, los beneficios y las evaluaciones.

## Estado del proyecto

| Entregable | Estado |
|---|---|
| Modelo entidad-relación de 14 entidades | Completado |
| Especificación del módulo de RRHH | Completado |
| Plan de implementación | Completado |
| Tareas técnicas | Completado |
| Implementación del MVP | Completado |
| Pruebas automatizadas | Completado (63 pruebas) |
| Demo integrada | Completado |

## Documentación

- [Especificación del módulo de RRHH](specs/002-rrhh-planilla/spec.md)
- [Plan de implementación](specs/002-rrhh-planilla/plan.md)
- [Modelo de datos](specs/002-rrhh-planilla/data-model.md)
- [Tareas](specs/002-rrhh-planilla/tasks.md)
- [Inicio rápido](specs/002-rrhh-planilla/quickstart.md)
- [Módulo base ERP](specs/001-erp-base-module/spec.md)

## Equipo

| Integrante |
|---|
| Ángel Gidi |
| José Sellán |
| Lucas Lemarie |
| Benjamín (valdechito) |
| Ricardo Cuevas |
| Vicente Morales |

## Cronograma

| Hito | Plazo | Entregable |
|---|---|---|
| Borrador del repositorio | 20 de octubre | Modelo ER y plan inicial. |
| Especificación funcional | Fin de octubre | Historias de usuario y criterios de aceptación. |
| Tareas técnicas | Principios de noviembre | `tasks.md` con tareas atómicas. |
| Construcción del MVP | Mediados de noviembre | Código funcional con datos de demo. |
| Entrega final | Semana del 30 de noviembre | Demo de 5 minutos y repositorio final. |

## Privacidad y datos sensibles

- El salario base, los datos bancarios y las liquidaciones solo son visibles para RRHH, Nómina y el propio empleado.
- Las ausencias médicas se registran por tipo y días, sin diagnósticos clínicos.
- Los cambios de salario, banco, rol y reapertura de nómina generan auditoría.
- Los datos de demo se almacenan localmente en el navegador y se pueden restablecer.

## Flujo de trabajo

- Trabajar sobre `main` o sobre la rama de la funcionalidad acordada, sin crear ramas paralelas fuera de Speckit.
- Un commit por incremento revisable, con mensaje `HUxx: descripción breve`.
- Actualizar primero el `spec.md` cuando cambie el alcance y luego regenerar las tareas.
- No considerar una tarea terminada sin sus pruebas y sin revisar regresiones.

## Uso académico

Proyecto desarrollado para el curso **Modelación de Sistemas 2026-2** de la Universidad de Concepción, dictado por el profesor **Juan Caros**. Su alcance es académico y no representa un sistema de nómina listo para producción.
