# Tareas: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Entrada**: Documentos de diseño desde `/specs/002-rrhh-planilla/`  
**Prerrequisitos**: [plan.md](plan.md) (obligatorio), [spec.md](spec.md) (obligatorio para las historias de usuario), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)  
**Estado**: MVP implementado (2026-11-03); ronda de corrección de análisis abierta — T102–T115 pendientes. Suite RRHH actual: 18 archivos de prueba (13 integración + 5 unitarios) y 57 pruebas aprobadas; build de producción verificado; guion de demo preparado  
**Cobertura**: 11 HU, 56 requisitos funcionales, 14 entidades oficiales y 2 colecciones de soporte (`USUARIOS`, `AUDITORIA`)  
**Formato**: `[ID] [P?] [HU] Descripción`

- `[P]` = tarea paralelizable con otras tareas de la misma fase.
- `[HU]` = historia de usuario a la que tributa la tarea.
- Cada tarea debe cerrarse con sus pruebas asociadas y sin regresiones.

## Convenciones de trabajo

- **Definición de terminado (DoD)**: código implementado, pruebas unitarias y de integración pasando, validación manual del flujo, sin errores de consola y con la documentación actualizada.
- **Commits**: un commit por incremento revisable, con mensaje `HUxx: descripción breve`.
- **Cambios de alcance**: si una tarea revela un requisito nuevo, se actualiza primero `spec.md` y luego se ajusta esta lista.

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Preparar la estructura del módulo de RRHH, los datos semilla y las herramientas de prueba.

- [X] T001 [P] Crear la estructura `src/hr/`, `src/data/`, `tests/unit/` y `tests/integration/` para el módulo de RRHH, y los archivos base `index.html`, `src/main.js`, `src/app.js` y `src/styles.css` si el módulo base 001 no está presente en el repositorio
- [X] T002 [P] Configurar Vitest y jsdom para las pruebas del módulo de RRHH
- [X] T003 Crear los datos semilla de las 14 entidades en `src/data/seed.js`, incluyendo los atributos extendidos de contacto, banco, documentos legales, contrato editable y saldos de permisos
- [X] T004 [P] Implementar utilidades compartidas de fechas, moneda y validación en `src/hr/utils.js`
- [X] T005 Configurar la navegación y el shell del módulo de RRHH en `src/hr/components/shell.js`

**Punto de control**: La estructura existe, los datos semilla cargan y las pruebas pueden ejecutarse.

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la persistencia, la sesión, el RBAC, la integridad referencial y los componentes base que usan todas las historias.

- [X] T006 Implementar el contrato de almacenamiento `localStorage` para las 14 entidades en `src/hr/storage.js`
- [X] T007 Implementar carga, guardado, restablecimiento de datos semilla y recuperación ante datos corruptos en `src/hr/storage.js`
- [X] T008 Implementar autenticación simulada y sesión de usuario en `src/hr/auth.js`
- [X] T009 Implementar la matriz de permisos RBAC por rol, pantalla y acción en `src/hr/auth.js`
- [X] T010 Implementar componentes UI base (tabla, formulario, modal y feedback) en `src/hr/components/`
- [X] T011 [P] Añadir pruebas unitarias de almacenamiento y validaciones en `tests/unit/hr-storage.test.js`
- [X] T012 [P] Añadir pruebas unitarias de autenticación y RBAC en `tests/unit/hr-auth.test.js`
- [X] T013 Implementar el registro de auditoría de acciones sensibles en `src/hr/audit.js`
- [X] T014 Implementar helpers de búsqueda, filtro y orden en `src/hr/search.js`
- [X] T015 [P] Añadir pruebas unitarias de integridad referencial, bloqueo de borrado y eliminación en cascada en `tests/unit/hr-storage.test.js`
- [X] T016 Implementar validaciones de integridad referencial, unicidad de RUT, bloqueo de borrado con dependencias y eliminación en cascada en `src/hr/storage.js`

**Punto de control**: La aplicación puede iniciar sesión, cargar datos semilla, persistir cambios, aplicar permisos básicos y proteger la integridad referencial.

---

## Fase 3: HU1 - Gestión de Departamentos (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir crear, editar y eliminar departamentos con validaciones de integridad.

**Prueba Independiente**: Un administrador crea un departamento, lo edita y comprueba que aparece en la lista; no puede eliminar uno con empleados activos.

- [X] T017 [P] [HU1] Añadir pruebas unitarias de validación de departamentos en `tests/unit/hr-storage.test.js`
- [X] T018 [P] [HU1] Añadir pruebas de integración del CRUD de departamentos en `tests/integration/departments.test.js`
- [X] T019 [HU1] Implementar la vista y el formulario de departamentos en `src/hr/components/departments.js`
- [X] T020 [HU1] Implementar crear, editar y eliminar departamentos con validación de nombre y código únicos, empresa y jefe de departamento
- [X] T021 [HU1] Bloquear la eliminación de departamentos con empleados activos y ofrecer reasignación

**Punto de control**: HU1 funcional y comprobable de forma independiente.

---

## Fase 4: HU2 - Catálogo de Cargos (Prioridad: P1)

**Objetivo**: Gestionar cargos y niveles de grado, protegiendo la integridad con los contratos.

**Prueba Independiente**: Un administrador crea un cargo, lo edita y no puede eliminarlo si está vinculado a un contrato vigente.

- [X] T022 [P] [HU2] Añadir pruebas unitarias de validación de cargos en `tests/unit/hr-storage.test.js`
- [X] T023 [P] [HU2] Añadir pruebas de integración del CRUD de cargos en `tests/integration/positions.test.js`
- [X] T024 [HU2] Implementar la vista y el formulario de cargos en `src/hr/components/positions.js`
- [X] T025 [HU2] Bloquear la eliminación de cargos asignados a empleados o referenciados por contratos vigentes y mostrar el motivo

**Punto de control**: HU1 y HU2 funcionales e independientes.

---

## Fase 5: HU3 - Datos personales y de contacto (Prioridad: P1)

**Objetivo**: Permitir el autoservicio de datos de contacto y la solicitud validada de cambios bancarios.

**Prueba Independiente**: Un empleado actualiza su teléfono y dirección; un cambio bancario queda pendiente de validación de RRHH.

- [X] T026 [P] [HU3] Añadir pruebas unitarias de validación del perfil, datos bancarios y su auditoría en `tests/unit/hr-storage.test.js`
- [X] T027 [P] [HU3] Añadir pruebas de integración de actualización de perfil en `tests/integration/employee-profile.test.js`
- [X] T028 [HU3] Implementar la vista de perfil del empleado en `src/hr/components/employees.js`
- [X] T029 [HU3] Implementar la solicitud de cambio bancario con estado pendiente, certificado adjunto, bloqueo de una segunda solicitud pendiente, aprobación de RRHH y registro de auditoría
- [X] T030 [HU3] Restringir la edición de sueldo, cargo y rol desde el autoservicio del empleado

**Punto de control**: HU3 funcional y con datos sensibles protegidos.

---

## Fase 6: HU4 - Altas y contratos (Prioridad: P1)

**Objetivo**: Registrar colaboradores y formalizar contratos con validaciones de vigencia, salario, moneda y jerarquía de supervisión.

**Prueba Independiente**: Un administrador crea un empleado con contrato válido y genera el documento desde la plantilla; un contrato inválido se rechaza.

- [X] T031 [P] [HU4] Añadir pruebas unitarias de validación de contratos en `tests/unit/hr-storage.test.js`
- [X] T032 [P] [HU4] Añadir pruebas unitarias de validación del empleado y de la jerarquía de supervisión en `tests/unit/hr-storage.test.js`
- [X] T033 [P] [HU4] Añadir pruebas de integración de alta de empleado y contrato en `tests/integration/contracts.test.js`
- [X] T034 [HU4] Implementar el formulario de alta de empleado con RUT, nombres, apellidos, correo, teléfono, dirección, fecha de contratación, estado laboral, departamento, cargo, supervisor, datos bancarios y documentos legales
- [X] T035 [HU4] Implementar el formulario de contrato con tipo, vigencia, salario y moneda, validando que la fecha de término sea igual o posterior al inicio, que el salario sea mayor que cero y que la moneda sea válida
- [X] T036 [HU4] Generar y persistir el contrato editable desde una plantilla con los datos del colaborador en `texto_contrato`
- [X] T037 [HU4] Implementar la regla de contrato vigente único y rechazo de superposiciones
- [X] T038 [HU4] Implementar las validaciones del empleado: RUT único y obligatorio, campos obligatorios, formato de correo, coherencia de fechas, documentos legales requeridos y supervisor perteneciente a la misma organización
- [X] T039 [HU4] Impedir que un empleado sea su propio supervisor y que se generen ciclos de supervisión
- [X] T040 [HU4] Mostrar el historial de contratos y conservar los contratos finalizados

**Punto de control**: HU4 funcional; las altas alimentan permisos, asistencia y nómina.

---

## Fase 7: HU5 - Aprobación de permisos (Prioridad: P1)

**Objetivo**: Gestionar solicitudes de ausencia con trazabilidad y validación de saldo, dotación y ausencias médicas.

**Prueba Independiente**: Un empleado envía una solicitud y su jefatura la aprueba o rechaza; el saldo y el calendario se actualizan.

- [X] T041 [P] [HU5] Añadir pruebas unitarias de validación de permisos en `tests/unit/hr-storage.test.js`
- [X] T042 [P] [HU5] Añadir pruebas unitarias del registro de ausencias médicas por tipo y días sin diagnósticos en `tests/unit/hr-storage.test.js`
- [X] T043 [P] [HU5] Añadir pruebas de integración de solicitud y aprobación en `tests/integration/permissions.test.js`
- [X] T044 [HU5] Implementar el catálogo de tipos de permiso con marca de remuneración y días anuales disponibles
- [X] T045 [HU5] Implementar el formulario de solicitud de permiso del empleado con fecha de solicitud y días solicitados
- [X] T046 [HU5] Implementar la bandeja de aprobación de la jefatura con comentario
- [X] T047 [HU5] Validar fechas, superposición, días solicitados contra `dias_vacaciones_disponibles`, saldo disponible y dotación mínima (al menos 1 empleado activo disponible)
- [X] T048 [HU5] Actualizar saldo y calendario al aprobar, y notificar al empleado
- [X] T049 [HU5] Implementar el registro de tipos y días de ausencia médica sin almacenar diagnósticos clínicos

**Punto de control**: HU5 funcional y trazable.

---

## Fase 8: HU6 - Asistencia diaria (Prioridad: P2)

**Objetivo**: Registrar entrada/salida y calcular horas trabajadas con validaciones de duplicados.

**Prueba Independiente**: Una jefatura registra la jornada de un colaborador, ve las horas calculadas y un registro inválido se rechaza.

- [X] T050 [P] [HU6] Añadir pruebas unitarias de cálculo de horas y duplicados en `tests/unit/hr-storage.test.js`
- [X] T051 [P] [HU6] Añadir pruebas de integración de registro de asistencia en `tests/integration/attendance.test.js`
- [X] T052 [HU6] Implementar la vista de registro diario de asistencia en `src/hr/components/attendance.js`, incluyendo el cálculo de horas extras; el panel de validación de horas extras pertenece a HU9 (T078)
- [X] T053 [HU6] Calcular horas trabajadas y horas extras, y rechazar salidas anteriores o iguales a la entrada
- [X] T054 [HU6] Implementar el resumen por área y período con indicador de ausentismo
- [X] T055 [HU6] Impedir el registro de asistencia para empleados desvinculados
- [X] T056 [HU6] Impedir más de un registro de asistencia por empleado y fecha

**Punto de control**: HU6 funcional; los datos alimentan la nómina y las horas extras.

---

## Fase 9: HU7 - Liquidación de nómina (Prioridad: P1)

**Objetivo**: Calcular y consultar liquidaciones con desglose de haberes y deducciones.

**Prueba Independiente**: Un encargado ejecuta la nómina de un período y el colaborador ve su papeleta; el neto coincide con haberes menos deducciones.

- [X] T057 [P] [HU7] Añadir pruebas unitarias del cálculo de nómina en `tests/unit/hr-payroll.test.js`
- [X] T058 [P] [HU7] Añadir pruebas de integración de liquidación en `tests/integration/payroll.test.js`
- [X] T059 [HU7] Implementar la gestión de períodos de nómina con estado y fechas
- [X] T060 [HU7] Implementar la gestión de conceptos de nómina (haber/deducción) con porcentaje o monto fijo
- [X] T061 [HU7] Implementar el motor de cálculo de haberes, deducciones y sueldo líquido en `src/hr/payroll.js`
- [X] T062 [HU7] Persistir la liquidación con `total_haberes`, `total_deducciones`, `sueldo_liquido` y sus detalles por concepto
- [X] T063 [HU7] Impedir duplicados por empleado/período y rechazar empleados sin contrato vigente
- [X] T064 [HU7] Implementar cierre de período, bloqueo de edición y reapertura de `Cerrado` a `Aprobado` solo por administrador, con auditoría y recálculo sin duplicados
- [X] T065 [HU7] Implementar la vista de papeleta propia y la descarga para el empleado
- [X] T066 [P] [HU7] Añadir pruebas unitarias de consolidación del costo de nómina por período y departamento en `tests/unit/hr-payroll.test.js`
- [X] T067 [HU7] Implementar la consolidación del costo de nómina por período y departamento

**Punto de control**: HU7 funcional; el cálculo es consistente y auditable.

---

## Fase 10: HU8 - Control de acceso basado en roles (Prioridad: P1)

**Objetivo**: Restringir pantallas, acciones y datos según el rol, incluso ante acceso directo, y auditar los cambios sensibles.

**Prueba Independiente**: Cuatro usuarios con roles distintos solo acceden a lo permitido; un acceso directo por URL se bloquea.

- [X] T068 [P] [HU8] Añadir pruebas unitarias de la matriz RBAC en `tests/unit/hr-auth.test.js`
- [X] T069 [P] [HU8] Añadir pruebas de integración de acceso por rol y URL en `tests/integration/rbac.test.js`
- [X] T070 [HU8] Implementar la pantalla de administración de usuarios y roles
- [X] T071 [HU8] Restringir navegación, acciones y rutas según el rol
- [X] T072 [HU8] Ocultar datos sensibles (salario, banco, salud) a roles no autorizados
- [X] T073 [HU8] Aplicar cambios de rol en el siguiente inicio de sesión y denegar acceso sin rol
- [X] T074 [P] [HU8] Añadir pruebas unitarias de auditoría de cambios de salario, datos bancarios y roles en `tests/unit/hr-auth.test.js`
- [X] T075 [HU8] Registrar auditoría de cambios de salario, datos bancarios y roles

**Punto de control**: HU8 funcional; no hay fugas de datos entre roles y los cambios sensibles quedan auditados.

---

## Fase 11: HU9 - Validación de asistencia y horas extras (Prioridad: P2)

**Objetivo**: Permitir a la jefatura validar asistencia y autorizar horas extras de su equipo directo.

**Prueba Independiente**: La jefatura aprueba horas extras y el concepto queda consolidado para la nómina sin duplicarse.

- [X] T076 [P] [HU9] Añadir pruebas unitarias de cálculo y aprobación de horas extras en `tests/unit/hr-payroll.test.js`
- [X] T077 [P] [HU9] Añadir pruebas de integración de aprobación de horas extras en `tests/integration/overtime.test.js`
- [X] T078 [HU9] Implementar el panel de validación de asistencia del equipo directo con estado de validación
- [X] T079 [HU9] Aprobar horas extras y consolidarlas como concepto de nómina solo si `estado_validacion = aprobado`
- [X] T080 [HU9] Impedir la doble aprobación y reutilizar la política central de ocultamiento de datos salariales de T072

**Punto de control**: HU9 funcional; la nómina solo consume horas extras aprobadas.

---

## Fase 12: HU10 - Beneficios (Prioridad: P2)

**Objetivo**: Administrar el catálogo de beneficios, inscribir colaboradores con historial y consolidar su costo.

**Prueba Independiente**: Un administrador crea un beneficio, inscribe a un colaborador y una inscripción duplicada se rechaza.

- [X] T081 [P] [HU10] Añadir pruebas unitarias de beneficios e inscripciones en `tests/unit/hr-storage.test.js`
- [X] T082 [P] [HU10] Añadir pruebas de integración de inscripción en `tests/integration/benefits.test.js`
- [X] T083 [HU10] Implementar el catálogo de beneficios con nombre, proveedor y costo
- [X] T084 [HU10] Implementar la inscripción y el historial de beneficios por empleado con `fecha_inscripcion`, `fecha_fin` y `estado`
- [X] T085 [HU10] Impedir inscripciones duplicadas activas y bloquear la eliminación de beneficios con inscripciones activas
- [X] T086 [P] [HU10] Añadir pruebas unitarias de consolidación del costo de beneficios por colaborador y período en `tests/unit/hr-storage.test.js`
- [X] T087 [HU10] Implementar la consolidación del costo de beneficios por colaborador y período considerando inscripciones activas y `fecha_fin`

**Punto de control**: HU10 funcional y con costo consolidado.

---

## Fase 13: HU11 - Evaluaciones de desempeño (Prioridad: P2)

**Objetivo**: Registrar evaluaciones objetivas de subordinados directos y mostrarlas al colaborador.

**Prueba Independiente**: Una jefatura evalúa a un subordinado con nota válida; una nota fuera de rango o un colaborador ajeno se rechazan.

- [X] T088 [P] [HU11] Añadir pruebas unitarias de validación de evaluaciones en `tests/unit/hr-storage.test.js`
- [X] T089 [P] [HU11] Añadir pruebas de integración de evaluaciones en `tests/integration/evaluations.test.js`
- [X] T090 [HU11] Implementar el formulario de evaluación con fecha, calificación y comentarios
- [X] T091 [HU11] Validar rango 1.00–5.00 y que el evaluado sea subordinado directo
- [X] T092 [HU11] Mostrar al colaborador solo sus evaluaciones y a RRHH el agregado

**Punto de control**: HU11 funcional; el colaborador solo ve sus propios datos.

---

## Fase 14: Integración, Pulido y Demo

**Propósito**: Unificar la experiencia, verificar rendimiento y preparar la demo integrada.

- [X] T093 [P] Implementar el panel de RRHH con dotación activa, distribución por área, ausentismo, costo de nómina por período/departamento y costo de beneficios
- [X] T094 [P] Implementar búsqueda y filtros por nombre, código, área, cargo, estado y período
- [X] T095 [P] Revisar accesibilidad (etiquetas, foco, contraste) y comportamiento responsivo
- [X] T096 [P] Sanitizar entradas y revisar la privacidad de datos sensibles
- [X] T097 Verificar rendimiento con 500 empleados y 500 registros de asistencia en menos de 10 segundos
- [X] T098 Ejecutar la suite completa de pruebas y corregir regresiones
- [X] T099 Ejecutar el build de producción y verificar que la aplicación inicia sin errores
- [X] T100 Actualizar `README.md` y `quickstart.md` con el estado final y las instrucciones
- [X] T101 Preparar y ejecutar la demo integrada de 5 minutos con el guion de las 11 HU

**Punto de control**: El MVP queda integrado, probado y demostrable.

---

## Fase 15: Correcciones de análisis y calidad (cierre antes de la entrega)

**Propósito**: Cerrar los hallazgos de `/speckit.analyze` que no estaban cubiertos por el MVP y dejar evidencia de calidad verificable.

- [ ] T102 Configurar ESLint (flat config), Prettier, `.prettierignore` y scripts `lint`/`format:check` en `package.json`; resolver los errores de análisis estático
- [ ] T103 Añadir humo E2E con Playwright (`tests/e2e/critical-flow.spec.js`) para login → RBAC → permiso → aprobación → nómina → papeleta (SC-011)
- [ ] T104 Verificar accesibilidad WCAG 2.1 AA y comportamiento responsivo en 360 px, 768 px y 1280 px; corregir etiquetas, foco, contraste y mensajes (FR-056)
- [ ] T105 Añadir pruebas automatizadas de rendimiento para nómina de 50 colaboradores < 5 s (SC-002) y aprobación de permiso < 2 s (SC-008)
- [X] T106 Adjuntar certificado en la solicitud bancaria y bloquear una segunda solicitud pendiente; pruebas de regresión (FR-010, HU3 esc. 2–3)
- [X] T107 Registrar `aprobado_por` y `fecha_resolucion` al aprobar/rechazar y exigir comentario al rechazar (FR-018, FR-020)
- [X] T108 Implementar reapertura de período cerrado con auditoría y recálculo sin duplicados; pruebas (FR-034)
- [X] T109 Permitir calificación decimal 1.00–5.00 en evaluaciones y actualizar formulario/pruebas (FR-041)
- [ ] T110 Añadir script de verificación de documentación (referencias entre `spec.md`, `plan.md`, `data-model.md` y `tasks.md`) para SC-010
- [ ] T111 Añadir pruebas automatizadas de sanitización XSS en entradas renderizadas (FR-049)
- [ ] T112 Añadir pruebas de la matriz de búsqueda/filtros por entidad (FR-052)
- [ ] T113 Validar el tiempo de alta empleado+contrato (< 3 min, SC-001) y la prueba de usabilidad del 90% (SC-003) en la demo
- [X] T114 Permitir que Encargado de Nómina acceda a asistencia (registro/consulta) y actualizar pruebas RBAC (HU6, FR-026)
- [ ] T115 Actualizar `README.md`, `quickstart.md`, `plan.md` y `data-model.md` con los conteos finales y el estado de T102–T114

**Punto de control**: Los hallazgos de análisis quedan cerrados con evidencia automatizada y la suite completa pasa sin regresiones.

---

## Cobertura de requisitos (FR → fase)

- **Fase 2**: FR-051, FR-054 (T015–T016).
- **Fase 3**: FR-001, FR-002, FR-003.
- **Fase 4**: FR-004, FR-005.
- **Fase 5**: FR-009, FR-010, FR-011; FR-048 (auditoría de datos bancarios, T029).
- **Fase 6**: FR-006, FR-007, FR-008, FR-012, FR-013, FR-014, FR-015, FR-016.
- **Fase 7**: FR-017, FR-018, FR-019, FR-020, FR-021, FR-050.
- **Fase 8**: FR-022, FR-023, FR-024, FR-025.
- **Fase 9**: FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036; FR-048 (reapertura de período, T064).
- **Fase 10**: FR-044, FR-045, FR-046, FR-047; FR-048 (salario y roles, T074–T075).
- **Fase 11**: FR-026, FR-027.
- **Fase 12**: FR-037, FR-038, FR-039, FR-040, FR-043.
- **Fase 13**: FR-041, FR-042.
- **Fase 14**: FR-049, FR-052, FR-053, FR-055, FR-056.
- **Fase 15**: FR-010, FR-018, FR-020, FR-034, FR-041, FR-049, FR-052, FR-056; SC-001, SC-002, SC-003, SC-008, SC-010, SC-011; HU3, HU5, HU6, HU7, HU11.

---

## Dependencias y Orden de Ejecución

### Dependencias entre fases

- **Fase 1 (Configuración)**: sin dependencias.
- **Fase 2 (Fundacional)**: depende de la Fase 1; T015–T016 deben completarse antes de las tareas CRUD de las HU.
- **HU1 (Fase 3)**: depende de la Fase 2.
- **HU2 (Fase 4)**: depende de la Fase 2; puede ejecutarse en paralelo con HU1.
- **HU3 (Fase 5)**: depende de HU4 para tener empleados de prueba; puede prepararse en paralelo con HU1/HU2.
- **HU4 (Fase 6)**: depende de HU1 y HU2 (departamento y cargo existentes); T038–T039 complementan las validaciones del alta.
- **HU5 (Fase 7)**: depende de HU3 y HU4 (empleado y jefatura); T049 depende de T044.
- **HU6 (Fase 8)**: depende de HU4 (empleados activos); T056 depende de T050 y T052.
- **HU7 (Fase 9)**: depende de HU4 (contratos) y HU6/HU9 (asistencia y horas extras); T066–T067 dependen de T061–T062.
- **HU8 (Fase 10)**: depende de la Fase 2; conviene implementarla antes de las pantallas sensibles; T074–T075 dependen de HU3, HU7 y HU8.
- **HU9 (Fase 11)**: depende de HU6 (asistencia registrada).
- **HU10 (Fase 12)**: depende de HU4 (empleados); T086–T087 dependen de T083–T084.
- **HU11 (Fase 13)**: depende de HU4 y HU8 (empleados y roles).
- **Fase 14 (Integración)**: depende de que las HU seleccionadas para la entrega estén completas; T093 depende de T067 y T087 para mostrar los costos consolidados.
- **Fase 15 (Correcciones de análisis)**: depende de T001–T101; T102–T105 y T110–T113 pueden avanzar en paralelo; T103 depende de T102 y del build estable; T115 depende de que T102–T114 estén resueltas.

### Oportunidades paralelas

- T001, T002, T003, T004 y T005 pueden avanzar en paralelo.
- T006, T008 y T010 pueden avanzar en paralelo una vez definida la estructura; T015–T016 pueden iniciarse junto con T006/T007.
- HU1 y HU2 pueden desarrollarse en paralelo.
- HU3, HU10 y HU11 pueden prepararse en paralelo mientras se completan HU1/HU2.
- Las pruebas de cada HU pueden escribirse junto con la implementación, sin esperar a la fase de pulido.
- T032, T038 y T039 pueden avanzar junto con el alta de empleado de HU4.
- T042 y T049 pueden avanzar junto con el catálogo de permisos de HU5.
- T066–T067 pueden avanzar junto con HU7; T074–T075 junto con HU8; T086–T087 junto con HU10.
- T093, T094, T095 y T096 pueden ejecutarse en paralelo antes de T097–T101.
- T102, T104, T105, T110, T111, T112 y T113 pueden avanzar en paralelo; T103 requiere build estable; T115 cierra la fase.
