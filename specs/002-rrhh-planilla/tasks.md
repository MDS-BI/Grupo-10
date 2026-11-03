# Tareas: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Entrada**: Documentos de diseño desde `/specs/002-rrhh-planilla/`  
**Prerrequisitos**: [plan.md](plan.md) (obligatorio), [spec.md](spec.md) (obligatorio para las historias de usuario), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)  
**Estado**: Planificación — implementación pendiente  
**Formato**: `[ID] [P?] [HU] Descripción — Responsable: Integrante`

- `[P]` = tarea paralelizable con otras tareas de la misma fase.
- `[HU]` = historia de usuario a la que tributa la tarea.
- Cada tarea debe cerrarse con sus pruebas asociadas y sin regresiones.

## Convenciones de trabajo

- **Dueño de la historia**: el responsable indicado en `spec.md` coordina las tareas de su HU.
- **Definición de terminado (DoD)**: código implementado, pruebas unitarias y de integración pasando, validación manual del flujo, sin errores de consola y con la documentación actualizada.
- **Commits**: un commit por incremento revisable, con mensaje `HUxx: descripción breve`.
- **Cambios de alcance**: si una tarea revela un requisito nuevo, se actualiza primero `spec.md` y luego se ajusta esta lista.

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Preparar la estructura del módulo de RRHH, los datos semilla y las herramientas de prueba.

- [ ] T001 [P] Crear la estructura `src/hr/`, `src/data/`, `tests/unit/` y `tests/integration/` para el módulo de RRHH — Responsable: Ángel Gidi
- [ ] T002 [P] Configurar Vitest y jsdom para las pruebas del módulo de RRHH — Responsable: Benjamín (valdechito)
- [ ] T003 Crear los datos semilla de las 14 entidades en `src/data/seed.js` — Responsable: Ángel Gidi
- [ ] T004 [P] Implementar utilidades compartidas de fechas, moneda y validación en `src/hr/utils.js` — Responsable: Lucas Lemarie
- [ ] T005 Configurar la navegación y el shell del módulo de RRHH en `src/hr/components/shell.js` — Responsable: Benjamín (valdechito)

**Punto de control**: La estructura existe, los datos semilla cargan y las pruebas pueden ejecutarse.

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la persistencia, la sesión, el RBAC y los componentes base que usan todas las historias.

- [ ] T006 Implementar el contrato de almacenamiento `localStorage` para las 14 entidades en `src/hr/storage.js` — Responsable: José Sellán
- [ ] T007 Implementar carga, guardado y restablecimiento de datos semilla en `src/hr/storage.js` — Responsable: José Sellán
- [ ] T008 Implementar autenticación simulada y sesión de usuario en `src/hr/auth.js` — Responsable: Benjamín (valdechito)
- [ ] T009 Implementar la matriz de permisos RBAC por rol, pantalla y acción en `src/hr/auth.js` — Responsable: Benjamín (valdechito)
- [ ] T010 Implementar componentes UI base (tabla, formulario, modal y feedback) en `src/hr/components/` — Responsable: Ángel Gidi
- [ ] T011 [P] Añadir pruebas unitarias de almacenamiento y validaciones en `tests/unit/hr-storage.test.js` — Responsable: José Sellán
- [ ] T012 [P] Añadir pruebas unitarias de autenticación y RBAC en `tests/unit/hr-auth.test.js` — Responsable: Benjamín (valdechito)
- [ ] T013 Implementar el registro de auditoría de acciones sensibles en `src/hr/audit.js` — Responsable: Benjamín (valdechito)
- [ ] T014 Implementar helpers de búsqueda, filtro y orden en `src/hr/search.js` — Responsable: Lucas Lemarie

**Punto de control**: La aplicación puede iniciar sesión, cargar datos semilla, persistir cambios y aplicar permisos básicos.

---

## Fase 3: HU1 - Gestión de Departamentos (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir crear, editar y eliminar departamentos con validaciones de integridad.

**Prueba Independiente**: Un administrador crea un departamento, lo edita y comprueba que aparece en la lista; no puede eliminar uno con empleados activos.

- [ ] T015 [P] [HU1] Añadir pruebas unitarias de validación de departamentos en `tests/unit/hr-storage.test.js` — Responsable: Ángel Gidi
- [ ] T016 [P] [HU1] Añadir pruebas de integración del CRUD de departamentos en `tests/integration/departments.test.js` — Responsable: Ángel Gidi
- [ ] T017 [HU1] Implementar la vista y el formulario de departamentos en `src/hr/components/departments.js` — Responsable: Ángel Gidi
- [ ] T018 [HU1] Implementar crear, editar y eliminar departamentos con validación de nombre y código único — Responsable: Ángel Gidi
- [ ] T019 [HU1] Bloquear la eliminación de departamentos con empleados activos y ofrecer reasignación — Responsable: Ángel Gidi

**Punto de control**: HU1 funcional y comprobable de forma independiente.

---

## Fase 4: HU2 - Catálogo de Cargos (Prioridad: P1)

**Objetivo**: Gestionar cargos y niveles de grado, protegiendo la integridad con los contratos.

**Prueba Independiente**: Un administrador crea un cargo, lo edita y no puede eliminarlo si está vinculado a un contrato vigente.

- [ ] T020 [P] [HU2] Añadir pruebas unitarias de validación de cargos en `tests/unit/hr-storage.test.js` — Responsable: Ángel Gidi
- [ ] T021 [P] [HU2] Añadir pruebas de integración del CRUD de cargos en `tests/integration/positions.test.js` — Responsable: Ángel Gidi
- [ ] T022 [HU2] Implementar la vista y el formulario de cargos en `src/hr/components/positions.js` — Responsable: Ángel Gidi
- [ ] T023 [HU2] Bloquear la eliminación de cargos con contratos vigentes y mostrar el motivo — Responsable: Ángel Gidi

**Punto de control**: HU1 y HU2 funcionales e independientes.

---

## Fase 5: HU3 - Datos personales y de contacto (Prioridad: P1)

**Objetivo**: Permitir el autoservicio de datos de contacto y la solicitud validada de cambios bancarios.

**Prueba Independiente**: Un empleado actualiza su teléfono y dirección; un cambio bancario queda pendiente de validación de RRHH.

- [ ] T024 [P] [HU3] Añadir pruebas unitarias de validación del perfil y datos bancarios en `tests/unit/hr-storage.test.js` — Responsable: José Sellán
- [ ] T025 [P] [HU3] Añadir pruebas de integración de actualización de perfil en `tests/integration/employee-profile.test.js` — Responsable: José Sellán
- [ ] T026 [HU3] Implementar la vista de perfil del empleado en `src/hr/components/employees.js` — Responsable: José Sellán
- [ ] T027 [HU3] Implementar la solicitud de cambio bancario con estado pendiente y aprobación de RRHH — Responsable: José Sellán
- [ ] T028 [HU3] Restringir la edición de sueldo, cargo y rol desde el autoservicio del empleado — Responsable: José Sellán

**Punto de control**: HU3 funcional y con datos sensibles protegidos.

---

## Fase 6: HU4 - Altas y contratos (Prioridad: P1)

**Objetivo**: Registrar colaboradores y formalizar contratos con validaciones de vigencia y salario.

**Prueba Independiente**: Un administrador crea un empleado con contrato válido y genera el documento desde la plantilla; un contrato inválido se rechaza.

- [ ] T029 [P] [HU4] Añadir pruebas unitarias de validación de contratos en `tests/unit/hr-storage.test.js` — Responsable: José Sellán
- [ ] T030 [P] [HU4] Añadir pruebas de integración de alta de empleado y contrato en `tests/integration/contracts.test.js` — Responsable: José Sellán
- [ ] T031 [HU4] Implementar el formulario de alta de empleado con datos obligatorios — Responsable: José Sellán
- [ ] T032 [HU4] Implementar el formulario de contrato con tipo, vigencia, salario y moneda — Responsable: José Sellán
- [ ] T033 [HU4] Generar el contrato editable desde una plantilla con los datos del colaborador — Responsable: José Sellán
- [ ] T034 [HU4] Implementar la regla de contrato vigente único y rechazo de superposiciones — Responsable: José Sellán
- [ ] T035 [HU4] Mostrar el historial de contratos y conservar los contratos finalizados — Responsable: José Sellán

**Punto de control**: HU4 funcional; las altas alimentan permisos, asistencia y nómina.

---

## Fase 7: HU5 - Aprobación de permisos (Prioridad: P1)

**Objetivo**: Gestionar solicitudes de ausencia con trazabilidad y validación de saldo y dotación.

**Prueba Independiente**: Un empleado envía una solicitud y su jefatura la aprueba o rechaza; el saldo y el calendario se actualizan.

- [ ] T036 [P] [HU5] Añadir pruebas unitarias de validación de permisos en `tests/unit/hr-storage.test.js` — Responsable: Juan Caros
- [ ] T037 [P] [HU5] Añadir pruebas de integración de solicitud y aprobación en `tests/integration/permissions.test.js` — Responsable: Juan Caros
- [ ] T038 [HU5] Implementar el catálogo de tipos de permiso con marca de remuneración — Responsable: Juan Caros
- [ ] T039 [HU5] Implementar el formulario de solicitud de permiso del empleado — Responsable: Juan Caros
- [ ] T040 [HU5] Implementar la bandeja de aprobación de la jefatura con comentario — Responsable: Juan Caros
- [ ] T041 [HU5] Validar fechas, superposición, saldo disponible y dotación mínima — Responsable: Juan Caros
- [ ] T042 [HU5] Actualizar saldo y calendario al aprobar, y notificar al empleado — Responsable: Juan Caros

**Punto de control**: HU5 funcional y trazable.

---

## Fase 8: HU6 - Asistencia diaria (Prioridad: P2)

**Objetivo**: Registrar entrada/salida y calcular horas trabajadas con validaciones de duplicados.

**Prueba Independiente**: Una jefatura registra la jornada de un colaborador, ve las horas calculadas y un registro inválido se rechaza.

- [ ] T043 [P] [HU6] Añadir pruebas unitarias de cálculo de horas y duplicados en `tests/unit/hr-storage.test.js` — Responsable: Lucas Lemarie
- [ ] T044 [P] [HU6] Añadir pruebas de integración de registro de asistencia en `tests/integration/attendance.test.js` — Responsable: Lucas Lemarie
- [ ] T045 [HU6] Implementar la vista de registro diario de asistencia en `src/hr/components/attendance.js` — Responsable: Lucas Lemarie
- [ ] T046 [HU6] Calcular horas trabajadas y rechazar salidas anteriores o iguales a la entrada — Responsable: Lucas Lemarie
- [ ] T047 [HU6] Implementar el resumen por área y período con indicador de ausentismo — Responsable: Lucas Lemarie
- [ ] T048 [HU6] Impedir el registro de asistencia para empleados desvinculados — Responsable: Lucas Lemarie

**Punto de control**: HU6 funcional; los datos alimentan la nómina y las horas extras.

---

## Fase 9: HU7 - Liquidación de nómina (Prioridad: P1)

**Objetivo**: Calcular y consultar liquidaciones con desglose de haberes y deducciones.

**Prueba Independiente**: Un encargado ejecuta la nómina de un período y el colaborador ve su papeleta; el neto coincide con haberes menos deducciones.

- [ ] T049 [P] [HU7] Añadir pruebas unitarias del cálculo de nómina en `tests/unit/hr-payroll.test.js` — Responsable: Lucas Lemarie
- [ ] T050 [P] [HU7] Añadir pruebas de integración de liquidación en `tests/integration/payroll.test.js` — Responsable: Lucas Lemarie
- [ ] T051 [HU7] Implementar la gestión de períodos de nómina con estado y fechas — Responsable: Lucas Lemarie
- [ ] T052 [HU7] Implementar la gestión de conceptos de nómina (haber/deducción) — Responsable: Lucas Lemarie
- [ ] T053 [HU7] Implementar el motor de cálculo de haberes, deducciones y sueldo líquido en `src/hr/payroll.js` — Responsable: Lucas Lemarie
- [ ] T054 [HU7] Persistir la liquidación y sus detalles por concepto — Responsable: Lucas Lemarie
- [ ] T055 [HU7] Impedir duplicados por empleado/período y rechazar empleados sin contrato vigente — Responsable: Lucas Lemarie
- [ ] T056 [HU7] Implementar cierre de período, bloqueo de edición y reapertura con auditoría — Responsable: Lucas Lemarie
- [ ] T057 [HU7] Implementar la vista de papeleta propia y la descarga para el empleado — Responsable: Lucas Lemarie

**Punto de control**: HU7 funcional; el cálculo es consistente y auditable.

---

## Fase 10: HU8 - Control de acceso basado en roles (Prioridad: P1)

**Objetivo**: Restringir pantallas, acciones y datos según el rol, incluso ante acceso directo.

**Prueba Independiente**: Cuatro usuarios con roles distintos solo acceden a lo permitido; un acceso directo por URL se bloquea.

- [ ] T058 [P] [HU8] Añadir pruebas unitarias de la matriz RBAC en `tests/unit/hr-auth.test.js` — Responsable: Benjamín (valdechito)
- [ ] T059 [P] [HU8] Añadir pruebas de integración de acceso por rol y URL en `tests/integration/rbac.test.js` — Responsable: Benjamín (valdechito)
- [ ] T060 [HU8] Implementar la pantalla de administración de usuarios y roles — Responsable: Benjamín (valdechito)
- [ ] T061 [HU8] Restringir navegación, acciones y rutas según el rol — Responsable: Benjamín (valdechito)
- [ ] T062 [HU8] Ocultar datos sensibles (salario, banco, salud) a roles no autorizados — Responsable: Benjamín (valdechito)
- [ ] T063 [HU8] Aplicar cambios de rol en el siguiente inicio de sesión y denegar acceso sin rol — Responsable: Benjamín (valdechito)

**Punto de control**: HU8 funcional; no hay fugas de datos entre roles.

---

## Fase 11: HU9 - Validación de asistencia y horas extras (Prioridad: P2)

**Objetivo**: Permitir a la jefatura validar asistencia y autorizar horas extras de su equipo directo.

**Prueba Independiente**: La jefatura aprueba horas extras y el concepto queda consolidado para la nómina sin duplicarse.

- [ ] T064 [P] [HU9] Añadir pruebas unitarias de cálculo y aprobación de horas extras en `tests/unit/hr-payroll.test.js` — Responsable: Juan Caros
- [ ] T065 [P] [HU9] Añadir pruebas de integración de aprobación de horas extras en `tests/integration/overtime.test.js` — Responsable: Juan Caros
- [ ] T066 [HU9] Implementar el panel de validación de asistencia del equipo directo — Responsable: Juan Caros
- [ ] T067 [HU9] Aprobar horas extras y consolidarlas como concepto de nómina — Responsable: Juan Caros
- [ ] T068 [HU9] Impedir la doble aprobación y ocultar datos salariales en el panel — Responsable: Juan Caros

**Punto de control**: HU9 funcional; la nómina solo consume horas extras aprobadas.

---

## Fase 12: HU10 - Beneficios (Prioridad: P2)

**Objetivo**: Administrar el catálogo de beneficios e inscribir colaboradores con historial.

**Prueba Independiente**: Un administrador crea un beneficio, inscribe a un colaborador y una inscripción duplicada se rechaza.

- [ ] T069 [P] [HU10] Añadir pruebas unitarias de beneficios e inscripciones en `tests/unit/hr-storage.test.js` — Responsable: Benjamín (valdechito)
- [ ] T070 [P] [HU10] Añadir pruebas de integración de inscripción en `tests/integration/benefits.test.js` — Responsable: Benjamín (valdechito)
- [ ] T071 [HU10] Implementar el catálogo de beneficios con nombre, proveedor y costo — Responsable: Benjamín (valdechito)
- [ ] T072 [HU10] Implementar la inscripción y el historial de beneficios por empleado — Responsable: Benjamín (valdechito)
- [ ] T073 [HU10] Impedir inscripciones duplicadas y bloquear la eliminación de beneficios con inscripciones activas — Responsable: Benjamín (valdechito)

**Punto de control**: HU10 funcional y con costo consolidado.

---

## Fase 13: HU11 - Evaluaciones de desempeño (Prioridad: P2)

**Objetivo**: Registrar evaluaciones objetivas de subordinados directos y mostrarlas al colaborador.

**Prueba Independiente**: Una jefatura evalúa a un subordinado con nota válida; una nota fuera de rango o un colaborador ajeno se rechazan.

- [ ] T074 [P] [HU11] Añadir pruebas unitarias de validación de evaluaciones en `tests/unit/hr-storage.test.js` — Responsable: Ángel Gidi
- [ ] T075 [P] [HU11] Añadir pruebas de integración de evaluaciones en `tests/integration/evaluations.test.js` — Responsable: Ángel Gidi
- [ ] T076 [HU11] Implementar el formulario de evaluación con fecha, calificación y comentarios — Responsable: Ángel Gidi
- [ ] T077 [HU11] Validar rango 1.00–5.00 y que el evaluado sea subordinado directo — Responsable: Ángel Gidi
- [ ] T078 [HU11] Mostrar al colaborador solo sus evaluaciones y a RRHH el agregado — Responsable: Ángel Gidi

**Punto de control**: HU11 funcional; el colaborador solo ve sus propios datos.

---

## Fase 14: Integración, Pulido y Demo

**Propósito**: Unificar la experiencia, verificar rendimiento y preparar la demo integrada.

- [ ] T079 [P] Implementar el panel de RRHH con dotación activa, distribución por área, ausentismo y costo de nómina — Responsable: Lucas Lemarie
- [ ] T080 [P] Implementar búsqueda y filtros por nombre, código, área, cargo, estado y período — Responsable: Lucas Lemarie
- [ ] T081 [P] Revisar accesibilidad (etiquetas, foco, contraste) y comportamiento responsivo — Responsable: Ángel Gidi
- [ ] T082 [P] Sanitizar entradas y revisar la privacidad de datos sensibles — Responsable: Benjamín (valdechito)
- [ ] T083 Verificar rendimiento con 500 empleados y 500 registros de asistencia — Responsable: Lucas Lemarie
- [ ] T084 Ejecutar la suite completa de pruebas y corregir regresiones — Responsable: José Sellán
- [ ] T085 Ejecutar el build de producción y verificar que la aplicación inicia sin errores — Responsable: José Sellán
- [ ] T086 Actualizar `README.md` y `quickstart.md` con el estado final y las instrucciones — Responsable: Benjamín (valdechito)
- [ ] T087 Preparar y ejecutar la demo integrada de 5 minutos con el guion de las 11 HU — Responsable: Ángel Gidi

**Punto de control**: El MVP queda integrado, probado y demostrable.

---

## Dependencias y Orden de Ejecución

### Dependencias entre fases

- **Fase 1 (Configuración)**: sin dependencias.
- **Fase 2 (Fundacional)**: depende de la Fase 1.
- **HU1 (Fase 3)**: depende de la Fase 2.
- **HU2 (Fase 4)**: depende de la Fase 2; puede ejecutarse en paralelo con HU1.
- **HU3 (Fase 5)**: depende de HU4 para tener empleados de prueba; puede prepararse en paralelo con HU1/HU2.
- **HU4 (Fase 6)**: depende de HU1 y HU2 (departamento y cargo existentes).
- **HU5 (Fase 7)**: depende de HU3 y HU4 (empleado y jefatura).
- **HU6 (Fase 8)**: depende de HU4 (empleados activos).
- **HU7 (Fase 9)**: depende de HU4 (contratos) y HU6/HU9 (asistencia y horas extras).
- **HU8 (Fase 10)**: depende de la Fase 2; conviene implementarla antes de las pantallas sensibles.
- **HU9 (Fase 11)**: depende de HU6 (asistencia registrada).
- **HU10 (Fase 12)**: depende de HU4 (empleados).
- **HU11 (Fase 13)**: depende de HU4 y HU8 (empleados y roles).
- **Fase 14 (Integración)**: depende de que las HU seleccionadas para la entrega estén completas.

### Oportunidades paralelas

- T001, T002, T003, T004 y T005 pueden avanzar en paralelo.
- T006, T008 y T010 pueden avanzar en paralelo una vez definida la estructura.
- HU1 y HU2 pueden desarrollarse en paralelo por el mismo responsable.
- HU3, HU10 y HU11 pueden prepararse en paralelo mientras se completan HU1/HU2.
- Las pruebas de cada HU pueden escribirse junto con la implementación, sin esperar a la fase de pulido.
- T079, T080, T081 y T082 pueden ejecutarse en paralelo antes de T083–T087.

---

## Resumen de Asignación por Integrante

| Integrante | Historias | Tareas principales |
|---|---|---|
| **Ángel Gidi** | HU1, HU2, HU11 | T001, T003, T010, T015–T023, T074–T078, T081, T087 |
| **José Sellán** | HU3, HU4 | T006, T007, T011, T024–T035, T084, T085 |
| **Juan Caros** | HU5, HU9 | T036–T042, T064–T068 |
| **Lucas Lemarie** | HU6, HU7 | T004, T014, T043–T057, T079, T080, T083 |
| **Benjamín (valdechito)** | HU8, HU10 | T002, T005, T008, T009, T012, T013, T058–T063, T069–T073, T082, T086 |
