# Tareas: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Entrada**: Documentos de diseño desde `/specs/002-rrhh-planilla/`  
**Prerrequisitos**: [plan.md](plan.md) (obligatorio), [spec.md](spec.md) (obligatorio para las historias de usuario), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)  
**Estado**: Planificación — implementación pendiente  
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

- [ ] T001 [P] Crear la estructura `src/hr/`, `src/data/`, `tests/unit/` y `tests/integration/` para el módulo de RRHH
- [ ] T002 [P] Configurar Vitest y jsdom para las pruebas del módulo de RRHH
- [ ] T003 Crear los datos semilla de las 14 entidades en `src/data/seed.js`
- [ ] T004 [P] Implementar utilidades compartidas de fechas, moneda y validación en `src/hr/utils.js`
- [ ] T005 Configurar la navegación y el shell del módulo de RRHH en `src/hr/components/shell.js`

**Punto de control**: La estructura existe, los datos semilla cargan y las pruebas pueden ejecutarse.

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la persistencia, la sesión, el RBAC y los componentes base que usan todas las historias.

- [ ] T006 Implementar el contrato de almacenamiento `localStorage` para las 14 entidades en `src/hr/storage.js`
- [ ] T007 Implementar carga, guardado y restablecimiento de datos semilla en `src/hr/storage.js`
- [ ] T008 Implementar autenticación simulada y sesión de usuario en `src/hr/auth.js`
- [ ] T009 Implementar la matriz de permisos RBAC por rol, pantalla y acción en `src/hr/auth.js`
- [ ] T010 Implementar componentes UI base (tabla, formulario, modal y feedback) en `src/hr/components/`
- [ ] T011 [P] Añadir pruebas unitarias de almacenamiento y validaciones en `tests/unit/hr-storage.test.js`
- [ ] T012 [P] Añadir pruebas unitarias de autenticación y RBAC en `tests/unit/hr-auth.test.js`
- [ ] T013 Implementar el registro de auditoría de acciones sensibles en `src/hr/audit.js`
- [ ] T014 Implementar helpers de búsqueda, filtro y orden en `src/hr/search.js`

**Punto de control**: La aplicación puede iniciar sesión, cargar datos semilla, persistir cambios y aplicar permisos básicos.

---

## Fase 3: HU1 - Gestión de Departamentos (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir crear, editar y eliminar departamentos con validaciones de integridad.

**Prueba Independiente**: Un administrador crea un departamento, lo edita y comprueba que aparece en la lista; no puede eliminar uno con empleados activos.

- [ ] T015 [P] [HU1] Añadir pruebas unitarias de validación de departamentos en `tests/unit/hr-storage.test.js`
- [ ] T016 [P] [HU1] Añadir pruebas de integración del CRUD de departamentos en `tests/integration/departments.test.js`
- [ ] T017 [HU1] Implementar la vista y el formulario de departamentos en `src/hr/components/departments.js`
- [ ] T018 [HU1] Implementar crear, editar y eliminar departamentos con validación de nombre y código único
- [ ] T019 [HU1] Bloquear la eliminación de departamentos con empleados activos y ofrecer reasignación

**Punto de control**: HU1 funcional y comprobable de forma independiente.

---

## Fase 4: HU2 - Catálogo de Cargos (Prioridad: P1)

**Objetivo**: Gestionar cargos y niveles de grado, protegiendo la integridad con los contratos.

**Prueba Independiente**: Un administrador crea un cargo, lo edita y no puede eliminarlo si está vinculado a un contrato vigente.

- [ ] T020 [P] [HU2] Añadir pruebas unitarias de validación de cargos en `tests/unit/hr-storage.test.js`
- [ ] T021 [P] [HU2] Añadir pruebas de integración del CRUD de cargos en `tests/integration/positions.test.js`
- [ ] T022 [HU2] Implementar la vista y el formulario de cargos en `src/hr/components/positions.js`
- [ ] T023 [HU2] Bloquear la eliminación de cargos con contratos vigentes y mostrar el motivo

**Punto de control**: HU1 y HU2 funcionales e independientes.

---

## Fase 5: HU3 - Datos personales y de contacto (Prioridad: P1)

**Objetivo**: Permitir el autoservicio de datos de contacto y la solicitud validada de cambios bancarios.

**Prueba Independiente**: Un empleado actualiza su teléfono y dirección; un cambio bancario queda pendiente de validación de RRHH.

- [ ] T024 [P] [HU3] Añadir pruebas unitarias de validación del perfil y datos bancarios en `tests/unit/hr-storage.test.js`
- [ ] T025 [P] [HU3] Añadir pruebas de integración de actualización de perfil en `tests/integration/employee-profile.test.js`
- [ ] T026 [HU3] Implementar la vista de perfil del empleado en `src/hr/components/employees.js`
- [ ] T027 [HU3] Implementar la solicitud de cambio bancario con estado pendiente y aprobación de RRHH
- [ ] T028 [HU3] Restringir la edición de sueldo, cargo y rol desde el autoservicio del empleado

**Punto de control**: HU3 funcional y con datos sensibles protegidos.

---

## Fase 6: HU4 - Altas y contratos (Prioridad: P1)

**Objetivo**: Registrar colaboradores y formalizar contratos con validaciones de vigencia y salario.

**Prueba Independiente**: Un administrador crea un empleado con contrato válido y genera el documento desde la plantilla; un contrato inválido se rechaza.

- [ ] T029 [P] [HU4] Añadir pruebas unitarias de validación de contratos en `tests/unit/hr-storage.test.js`
- [ ] T030 [P] [HU4] Añadir pruebas de integración de alta de empleado y contrato en `tests/integration/contracts.test.js`
- [ ] T031 [HU4] Implementar el formulario de alta de empleado con datos obligatorios
- [ ] T032 [HU4] Implementar el formulario de contrato con tipo, vigencia, salario y moneda
- [ ] T033 [HU4] Generar el contrato editable desde una plantilla con los datos del colaborador
- [ ] T034 [HU4] Implementar la regla de contrato vigente único y rechazo de superposiciones
- [ ] T035 [HU4] Mostrar el historial de contratos y conservar los contratos finalizados

**Punto de control**: HU4 funcional; las altas alimentan permisos, asistencia y nómina.

---

## Fase 7: HU5 - Aprobación de permisos (Prioridad: P1)

**Objetivo**: Gestionar solicitudes de ausencia con trazabilidad y validación de saldo y dotación.

**Prueba Independiente**: Un empleado envía una solicitud y su jefatura la aprueba o rechaza; el saldo y el calendario se actualizan.

- [ ] T036 [P] [HU5] Añadir pruebas unitarias de validación de permisos en `tests/unit/hr-storage.test.js`
- [ ] T037 [P] [HU5] Añadir pruebas de integración de solicitud y aprobación en `tests/integration/permissions.test.js`
- [ ] T038 [HU5] Implementar el catálogo de tipos de permiso con marca de remuneración
- [ ] T039 [HU5] Implementar el formulario de solicitud de permiso del empleado
- [ ] T040 [HU5] Implementar la bandeja de aprobación de la jefatura con comentario
- [ ] T041 [HU5] Validar fechas, superposición, saldo disponible y dotación mínima
- [ ] T042 [HU5] Actualizar saldo y calendario al aprobar, y notificar al empleado

**Punto de control**: HU5 funcional y trazable.

---

## Fase 8: HU6 - Asistencia diaria (Prioridad: P2)

**Objetivo**: Registrar entrada/salida y calcular horas trabajadas con validaciones de duplicados.

**Prueba Independiente**: Una jefatura registra la jornada de un colaborador, ve las horas calculadas y un registro inválido se rechaza.

- [ ] T043 [P] [HU6] Añadir pruebas unitarias de cálculo de horas y duplicados en `tests/unit/hr-storage.test.js`
- [ ] T044 [P] [HU6] Añadir pruebas de integración de registro de asistencia en `tests/integration/attendance.test.js`
- [ ] T045 [HU6] Implementar la vista de registro diario de asistencia en `src/hr/components/attendance.js`
- [ ] T046 [HU6] Calcular horas trabajadas y rechazar salidas anteriores o iguales a la entrada
- [ ] T047 [HU6] Implementar el resumen por área y período con indicador de ausentismo
- [ ] T048 [HU6] Impedir el registro de asistencia para empleados desvinculados

**Punto de control**: HU6 funcional; los datos alimentan la nómina y las horas extras.

---

## Fase 9: HU7 - Liquidación de nómina (Prioridad: P1)

**Objetivo**: Calcular y consultar liquidaciones con desglose de haberes y deducciones.

**Prueba Independiente**: Un encargado ejecuta la nómina de un período y el colaborador ve su papeleta; el neto coincide con haberes menos deducciones.

- [ ] T049 [P] [HU7] Añadir pruebas unitarias del cálculo de nómina en `tests/unit/hr-payroll.test.js`
- [ ] T050 [P] [HU7] Añadir pruebas de integración de liquidación en `tests/integration/payroll.test.js`
- [ ] T051 [HU7] Implementar la gestión de períodos de nómina con estado y fechas
- [ ] T052 [HU7] Implementar la gestión de conceptos de nómina (haber/deducción)
- [ ] T053 [HU7] Implementar el motor de cálculo de haberes, deducciones y sueldo líquido en `src/hr/payroll.js`
- [ ] T054 [HU7] Persistir la liquidación y sus detalles por concepto
- [ ] T055 [HU7] Impedir duplicados por empleado/período y rechazar empleados sin contrato vigente
- [ ] T056 [HU7] Implementar cierre de período, bloqueo de edición y reapertura con auditoría
- [ ] T057 [HU7] Implementar la vista de papeleta propia y la descarga para el empleado

**Punto de control**: HU7 funcional; el cálculo es consistente y auditable.

---

## Fase 10: HU8 - Control de acceso basado en roles (Prioridad: P1)

**Objetivo**: Restringir pantallas, acciones y datos según el rol, incluso ante acceso directo.

**Prueba Independiente**: Cuatro usuarios con roles distintos solo acceden a lo permitido; un acceso directo por URL se bloquea.

- [ ] T058 [P] [HU8] Añadir pruebas unitarias de la matriz RBAC en `tests/unit/hr-auth.test.js`
- [ ] T059 [P] [HU8] Añadir pruebas de integración de acceso por rol y URL en `tests/integration/rbac.test.js`
- [ ] T060 [HU8] Implementar la pantalla de administración de usuarios y roles
- [ ] T061 [HU8] Restringir navegación, acciones y rutas según el rol
- [ ] T062 [HU8] Ocultar datos sensibles (salario, banco, salud) a roles no autorizados
- [ ] T063 [HU8] Aplicar cambios de rol en el siguiente inicio de sesión y denegar acceso sin rol

**Punto de control**: HU8 funcional; no hay fugas de datos entre roles.

---

## Fase 11: HU9 - Validación de asistencia y horas extras (Prioridad: P2)

**Objetivo**: Permitir a la jefatura validar asistencia y autorizar horas extras de su equipo directo.

**Prueba Independiente**: La jefatura aprueba horas extras y el concepto queda consolidado para la nómina sin duplicarse.

- [ ] T064 [P] [HU9] Añadir pruebas unitarias de cálculo y aprobación de horas extras en `tests/unit/hr-payroll.test.js`
- [ ] T065 [P] [HU9] Añadir pruebas de integración de aprobación de horas extras en `tests/integration/overtime.test.js`
- [ ] T066 [HU9] Implementar el panel de validación de asistencia del equipo directo
- [ ] T067 [HU9] Aprobar horas extras y consolidarlas como concepto de nómina
- [ ] T068 [HU9] Impedir la doble aprobación y ocultar datos salariales en el panel

**Punto de control**: HU9 funcional; la nómina solo consume horas extras aprobadas.

---

## Fase 12: HU10 - Beneficios (Prioridad: P2)

**Objetivo**: Administrar el catálogo de beneficios e inscribir colaboradores con historial.

**Prueba Independiente**: Un administrador crea un beneficio, inscribe a un colaborador y una inscripción duplicada se rechaza.

- [ ] T069 [P] [HU10] Añadir pruebas unitarias de beneficios e inscripciones en `tests/unit/hr-storage.test.js`
- [ ] T070 [P] [HU10] Añadir pruebas de integración de inscripción en `tests/integration/benefits.test.js`
- [ ] T071 [HU10] Implementar el catálogo de beneficios con nombre, proveedor y costo
- [ ] T072 [HU10] Implementar la inscripción y el historial de beneficios por empleado
- [ ] T073 [HU10] Impedir inscripciones duplicadas y bloquear la eliminación de beneficios con inscripciones activas

**Punto de control**: HU10 funcional y con costo consolidado.

---

## Fase 13: HU11 - Evaluaciones de desempeño (Prioridad: P2)

**Objetivo**: Registrar evaluaciones objetivas de subordinados directos y mostrarlas al colaborador.

**Prueba Independiente**: Una jefatura evalúa a un subordinado con nota válida; una nota fuera de rango o un colaborador ajeno se rechazan.

- [ ] T074 [P] [HU11] Añadir pruebas unitarias de validación de evaluaciones en `tests/unit/hr-storage.test.js`
- [ ] T075 [P] [HU11] Añadir pruebas de integración de evaluaciones en `tests/integration/evaluations.test.js`
- [ ] T076 [HU11] Implementar el formulario de evaluación con fecha, calificación y comentarios
- [ ] T077 [HU11] Validar rango 1.00–5.00 y que el evaluado sea subordinado directo
- [ ] T078 [HU11] Mostrar al colaborador solo sus evaluaciones y a RRHH el agregado

**Punto de control**: HU11 funcional; el colaborador solo ve sus propios datos.

---

## Fase 14: Integración, Pulido y Demo

**Propósito**: Unificar la experiencia, verificar rendimiento y preparar la demo integrada.

- [ ] T079 [P] Implementar el panel de RRHH con dotación activa, distribución por área, ausentismo y costo de nómina
- [ ] T080 [P] Implementar búsqueda y filtros por nombre, código, área, cargo, estado y período
- [ ] T081 [P] Revisar accesibilidad (etiquetas, foco, contraste) y comportamiento responsivo
- [ ] T082 [P] Sanitizar entradas y revisar la privacidad de datos sensibles
- [ ] T083 Verificar rendimiento con 500 empleados y 500 registros de asistencia
- [ ] T084 Ejecutar la suite completa de pruebas y corregir regresiones
- [ ] T085 Ejecutar el build de producción y verificar que la aplicación inicia sin errores
- [ ] T086 Actualizar `README.md` y `quickstart.md` con el estado final y las instrucciones
- [ ] T087 Preparar y ejecutar la demo integrada de 5 minutos con el guion de las 11 HU

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
- HU1 y HU2 pueden desarrollarse en paralelo.
- HU3, HU10 y HU11 pueden prepararse en paralelo mientras se completan HU1/HU2.
- Las pruebas de cada HU pueden escribirse junto con la implementación, sin esperar a la fase de pulido.
- T079, T080, T081 y T082 pueden ejecutarse en paralelo antes de T083–T087.

