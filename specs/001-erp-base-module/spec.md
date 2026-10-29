# Especificación de la Funcionalidad: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Rama de la funcionalidad**: 002-rrhh-planilla  
**Creada**: 2026-07-08
**Estado**: Borrador
**Entrada**: Descripción del usuario: "Gestionar la información del personal y la administración de recursos humanos: fichas laborales, contratos, permisos, asistencia, beneficios, evaluaciones y nóminas de pago, sobre el modelo relacional oficial del ERP."

## Propósito

Este proyecto implementa el módulo de Recursos Humanos y Planilla (HR / Payroll) sobre el módulo base de ERP. Reutiliza los patrones de datos maestros, documentos, navegación, validación, persistencia y búsqueda del ERP base, y los extiende con las 14 tablas del módulo HR/Payroll definidas en `erp_data_model.md`: estructura organizacional, personal, contratos, permisos, asistencia, nómina, beneficios y desempeño.

El objetivo del MVP es centralizar las fichas laborales, formalizar contratos, gestionar permisos de forma trazable, registrar asistencia y simular la liquidación mensual, con control de acceso por roles y protección de datos sensibles. La arquitectura de datos y las claves foráneas oficiales se detallan en `erp_data_model.md` (sección 1); `data-model.md` es la vista de negocio en español del mismo módulo. El alcance y los roles se detallan en `plan.md`.

## Alcance del MVP

1. **Panel de inicio**: KPIs de dotación activa, ausentismo, solicitudes pendientes y costo de la última nómina, con acciones rápidas.
2. **Fichas y contratos**: alta, edición, baja lógica y consulta filtrable de colaboradores y contratos.
3. **Simulador de liquidación**: cálculo y desglose de haberes, deducciones y sueldo líquido por colaborador y período.
4. **Gestión de permisos**: autoservicio del empleado y bandeja de aprobación de la jefatura.
5. **Asistencia**: registro y consulta de jornadas para alimentar ausentismo y horas efectivas.
6. **Seguridad**: autenticación simulada y autorización por roles.

**Fuera del alcance del MVP**: motor legal de impuestos y finiquitos, transferencias bancarias, firma electrónica, integraciones contables reales, interfaz de beneficios y evaluaciones de desempeño (tablas modeladas), reclutamiento, capacitación y planificación de turnos.

## Mapeo entre Terminología de Negocio y Tablas del ERP

La especificación usa términos de negocio en español; las tablas, claves primarias y claves foráneas oficiales se rigen por `erp_data_model.md`.

| Término de negocio | Tabla oficial | Clave primaria | Uso en el módulo |
|---|---|---|---|
| Departamento | `departments` | `department_id` | Estructura organizacional y dotación. |
| Cargo | `job_titles` | `job_title_id` | Puesto y banda jerárquica o salarial. |
| Colaborador / Empleado | `employees` | `employee_id` | Maestro transversal de personal. |
| Contrato | `employee_contracts` | `contract_id` | Vigencia, tipo, salario base y moneda. |
| Tipo de permiso | `leave_types` | `leave_type_id` | Catálogo de ausencias y si son remuneradas. |
| Solicitud de permiso | `leave_requests` | `leave_request_id` | Solicitudes de vacaciones o permisos. |
| Asistencia | `attendance_records` | `attendance_id` | Marcación diaria y horas trabajadas. |
| Concepto de nómina | `payroll_concepts` | `concept_id` | Haberes y deducciones. |
| Período de nómina | `payroll_runs` | `payroll_run_id` | Corrida mensual y su estado. |
| Liquidación / Papeleta | `payslips` | `payslip_id` | Resultado por colaborador y período. |
| Detalle de liquidación | `payslip_lines` | `payslip_line_id` | Renglones de haberes y deducciones. |
| Beneficio | `benefits` | `benefit_id` | Catálogo de beneficios. |
| Beneficio de empleado | `employee_benefits` | `employee_benefit_id` | Inscripción de un colaborador. |
| Evaluación de desempeño | `performance_reviews` | `review_id` | Evaluación y calificación del colaborador. |
| Configuración del módulo | No es tabla | — | `ModuleConfig` de la aplicación. |
| Usuario / Rol | No modelado | — | RBAC en la capa de aplicación. |

**Tablas compartidas del ERP**: `companies`, `currencies`, `cost_centers` y `journal_entries` no forman parte de las 14 tablas del módulo HR/Payroll, pero se usan para la integración multiempresa, monetaria, de centros de costo y contable.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Crear y organizar entidades (Prioridad: P1)
Como usuario de negocio, quiero crear entradas de entidad con detalles claros para poder construir y mantener los datos maestros del módulo.

**Por qué esta prioridad**: Este es el valor central del producto porque, sin crear entidades, el resto de la experiencia no puede aportar valor.

**Prueba Independiente**: Un usuario puede abrir el módulo, añadir una nueva entidad y verla aparecer en la lista.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está viendo la lista de entidades, **cuando** crea una nueva entidad con un nombre y un código, **entonces** la nueva entidad se guarda y aparece en la lista.
2. **Dado** que un usuario está creando una entidad, **cuando** deja la información obligatoria en blanco, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)
Como usuario de negocio, quiero actualizar o eliminar entidades cuando cambien los datos maestros para que los registros se mantengan precisos.

**Por qué esta prioridad**: Mantener los registros actualizados es esencial para la confianza en la herramienta y para soportar las operaciones comerciales diarias.

**Prueba Independiente**: Un usuario puede seleccionar una entidad existente, cambiar su información o eliminarla, y la lista refleja el cambio.

**Escenarios de Aceptación**:

1. **Dada** una entidad que ya existe en la lista, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda y se muestra en la lista.
2. **Dada** una entidad que ya no es relevante, **cuando** el usuario la elimina, **entonces** desaparece de la lista y deja de aparecer en los resultados de búsqueda.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario edita o elimina una, **entonces** la lista se actualiza correctamente y sigue siendo ágil.

---

### Historia de Usuario 3 - Panel de inicio con acciones rápidas y estadísticas de registros (Prioridad: P1)

Como usuario de negocio, quiero aterrizar en un panel estilo ERP con botones de acción rápida claramente etiquetados para las tareas clave y totales de registros de un vistazo al abrir la aplicación, para poder empezar a trabajar de inmediato.

**Por qué esta prioridad**: El panel es el punto de entrada de la aplicación. Nada más puede alcanzarse sin él, y las acciones rápidas son la ruta más rápida hacia cada flujo de trabajo central.

**Prueba Independiente**: Un usuario abre la aplicación, ve un panel con múltiples botones de acción rápida y estadísticas de registros, inicia una nueva entidad o documento con un solo clic y ve estadísticas que reflejan los datos almacenados.

**Escenarios de Aceptación**:

1. **Dado** que el usuario abre la aplicación, **cuando** la aplicación carga, **entonces** se muestra el panel de inicio con al menos cuatro botones de acción rápida claramente etiquetados que cubren las tareas ERP clave: crear una nueva entidad, crear un nuevo documento, abrir la gestión de entidades y buscar registros.
2. **Dado** que se muestra el panel, **cuando** el usuario activa la acción de nueva entidad, **entonces** la aplicación abre el área de gestión de entidades con un formulario vacío listo para introducir datos.
3. **Dado** que se muestra el panel, **cuando** el usuario activa la acción de nuevo documento, **entonces** la aplicación abre el área de gestión de documentos con un formulario vacío listo para introducir datos.
4. **Dado** que se muestra el panel, **cuando** el usuario activa la acción de buscar registros, **entonces** la aplicación abre la pantalla de búsqueda con el campo de búsqueda enfocado.
5. **Dadas** entidades y documentos almacenados, **cuando** el usuario ve el panel, **entonces** las tarjetas de estadísticas muestran el recuento actual de entidades y documentos.
6. **Dado** que el usuario crea o elimina registros en otra parte de la aplicación, **cuando** vuelve al panel, **entonces** las estadísticas reflejan el cambio.

---

### Historia de Usuario 4 - Actualización de datos personales y de contacto (Prioridad: P1)
Como empleado, quiero actualizar mis datos personales, de contacto y bancarios para que la empresa pueda comunicarse conmigo correctamente y emitir mis pagos sin errores.

**Por qué esta prioridad**: Mantener la información de los colaboradores al día previene problemas administrativos, de nómina y asegura una comunicación fluida y legalmente válida.

**Prueba Independiente**: Un empleado puede modificar su dirección o información de contacto en su perfil, y los cambios se reflejan inmediatamente tanto en su vista como en el registro accesible para RRHH.

**Escenarios de Aceptación**:

1. **Dada** la ficha del perfil del empleado, **cuando** el usuario modifica su número de teléfono o dirección, **entonces** la nueva información se guarda de forma segura y se muestra actualizada en pantalla.
2. **Dado** que el empleado necesita cambiar su cuenta bancaria para el depósito de su sueldo, **cuando** ingresa los nuevos datos y adjunta el certificado del banco, **entonces** la solicitud queda pendiente de validación y se notifica al administrador de RRHH.

---

### Historia de Usuario 5 - Gestión de altas y contratos de nuevos colaboradores (Prioridad: P1)
Como administrador de RRHH, quiero registrar un nuevo colaborador y generar su contrato de trabajo para mantener formalizada su incorporación a la empresa.

**Por qué esta prioridad**: Un proceso de alta ágil y estructurado asegura el cumplimiento legal laboral, la correcta integración a la nómina y el acceso oportuno del colaborador a los sistemas internos.

**Prueba Independiente**: Un administrador de RRHH puede ingresar los datos de un nuevo empleado, adjuntar los documentos legales requeridos y generar el contrato basado en una plantilla predefinida.

**Escenarios de Aceptación**:

1. **Dado** el formulario de ingreso de personal, **cuando** el administrador completa los datos obligatorios (RUT, cargo, sueldo, fecha de inicio) y sube los documentos requeridos, **entonces** el perfil del empleado se crea exitosamente en el sistema.
2. **Dada** la creación del perfil, **cuando** el administrador selecciona la plantilla del contrato correspondiente al cargo, **entonces** el sistema genera un documento editable y con los datos precargados del colaborador.

---

### Historia de Usuario 6 - Aprobación de solicitudes de vacaciones y permisos (Prioridad: P1)
Como jefatura o supervisor, quiero revisar y aprobar o rechazar las solicitudes de vacaciones y permisos de mi equipo para asegurar la continuidad operacional del área.

**Por qué esta prioridad**: Gestionar las ausencias de manera oportuna evita cuellos de botella en la operación diaria y mantiene una planificación transparente y justa del personal a cargo.

**Prueba Independiente**: Una jefatura puede visualizar las solicitudes pendientes de su equipo, verificar los días disponibles en el saldo y aprobarlas o rechazarlas con un comentario opcional.

**Escenarios de Aceptación**:

1. **Dada** una solicitud de vacaciones enviada por un miembro del equipo, **cuando** el supervisor revisa las fechas y el saldo de días disponibles, **entonces** puede hacer clic en "Aprobar" y el sistema actualiza el calendario y el saldo del empleado.
2. **Dada** una solicitud que genera un conflicto de dotación mínima en el área, **cuando** el supervisor la rechaza indicando un motivo, **entonces** la solicitud cambia de estado y se notifica al empleado con el comentario ingresado.

---

### Historia de Usuario 7 - Registrar y consultar la asistencia diaria (Prioridad: P2)
Como jefatura o encargado de nómina, quiero registrar y consultar la asistencia diaria y las horas trabajadas del personal para alimentar los indicadores de ausentismo y el cálculo de la nómina.

**Por qué esta prioridad**: Los registros de asistencia son la fuente de verdad para medir ausentismo y horas efectivas; sin ellos, los indicadores del panel y las liquidaciones carecen de respaldo. Es una capacidad necesaria para la operación, aunque no bloquea la gestión básica de personal y permisos.

**Prueba Independiente**: Una jefatura puede registrar la entrada y salida de un colaborador, ver las horas calculadas y consultar el resumen del período; un registro duplicado o inválido se rechaza.

**Escenarios de Aceptación**:

1. **Dado** un colaborador activo y una fecha laboral, **cuando** se registran la hora de entrada y la hora de salida, **entonces** el sistema calcula las horas trabajadas y guarda el registro.
2. **Dado** un registro existente para el mismo colaborador y fecha, **cuando** se intenta crear otro, **entonces** el sistema lo impide y explica que la jornada ya está registrada.
3. **Dado** un registro con hora de salida anterior o igual a la hora de entrada, **cuando** se guarda, **entonces** el sistema lo rechaza con una explicación clara.
4. **Dados** los registros de un período, **cuando** la jefatura consulta por área, **entonces** ve las horas trabajadas, las ausencias y un resumen de ausentismo.
5. **Dado** un colaborador desvinculado, **cuando** se intenta registrar asistencia, **entonces** el sistema lo impide y conserva el historial existente.

---

### Historia de Usuario 8 - Ejecutar y consultar la liquidación de nómina (Prioridad: P1)
Como encargado de nómina, quiero calcular y consultar las liquidaciones de un período para pagar correctamente haberes y deducciones y entregar la papeleta al colaborador.

**Por qué esta prioridad**: La liquidación es el resultado central del módulo: concentra contrato, conceptos y período, y debe ser trazable, consistente y visible solo para quienes corresponda.

**Prueba Independiente**: Un encargado de nómina selecciona un período y un colaborador con contrato vigente, ejecuta la liquidación, revisa el desglose de haberes y deducciones, y el colaborador ve su propia papeleta.

**Escenarios de Aceptación**:

1. **Dado** un período en estado borrador y un colaborador con contrato vigente, **cuando** se ejecuta la liquidación, **entonces** el sistema calcula el total de haberes, las deducciones y el sueldo líquido, y guarda la liquidación con sus detalles.
2. **Dados** los conceptos de nómina clasificados como haber o deducción, **cuando** se consulta la liquidación, **entonces** se muestra el desglose por concepto y se cumple que el sueldo líquido es igual al total de haberes menos las deducciones.
3. **Dado** un período ya calculado, **cuando** se intenta generar una segunda liquidación para el mismo colaborador, **entonces** el sistema la impide y explica que ya existe.
4. **Dado** un período cerrado, **cuando** se intenta modificar una liquidación, **entonces** el sistema lo impide; solo un usuario autorizado puede reabrirlo dejando registro de auditoría.
5. **Dado** un colaborador autenticado, **cuando** consulta sus liquidaciones, **entonces** solo ve las propias y puede descargar su papeleta.
6. **Dado** un colaborador sin contrato vigente en el período, **cuando** se intenta liquidar, **entonces** el sistema lo rechaza con una explicación clara.

---

### Historia de Usuario 9 - Control de acceso basado en roles (Prioridad: P1)
Como administrador de RRHH, quiero asignar roles y limitar las acciones y los datos a los que accede cada usuario para proteger la información sensible y asegurar que cada persona realice solo las tareas que le corresponden.

**Por qué esta prioridad**: El módulo maneja datos personales, salariales y de salud; el acceso debe restringirse por rol antes de usarlo con datos reales. La confidencialidad salarial y la separación entre jefatura, nómina y administración son requisitos del negocio.

**Prueba Independiente**: El administrador asigna roles a cuatro usuarios; cada uno inicia sesión y solo ve las pantallas y datos permitidos; un intento de acceso directo por URL a otra área se bloquea con un mensaje claro.

**Escenarios de Aceptación**:

1. **Dado** un usuario con rol Administrador de RRHH, **cuando** inicia sesión, **entonces** puede gestionar departamentos, cargos, colaboradores y contratos, con control total sobre las fichas de personal.
2. **Dado** un usuario con rol Encargado de Nómina, **cuando** inicia sesión, **entonces** puede administrar períodos, conceptos y liquidaciones, pero no puede modificar fichas de personal ni acceder a datos médicos.
3. **Dado** un usuario con rol Jefatura o Supervisor, **cuando** inicia sesión, **entonces** solo puede ver y visar permisos y asistencia de sus subordinados directos, sin visibilidad del salario base.
4. **Dado** un usuario con rol Empleado, **cuando** inicia sesión, **entonces** solo ve sus propias papeletas y solicitudes, y no puede acceder a registros de otros colaboradores.
5. **Dado** un usuario autenticado, **cuando** intenta acceder a una pantalla o acción fuera de sus permisos por navegación o por URL directa, **entonces** el sistema bloquea la operación, muestra un mensaje claro y no expone datos sensibles.
6. **Dado** un usuario sin rol asignado, **cuando** intenta acceder al módulo, **entonces** el sistema le deniega el acceso hasta que un administrador le asigne un rol.
7. **Dado** un cambio de rol realizado por un administrador, **cuando** el usuario afectado vuelve a iniciar sesión, **entonces** los nuevos permisos se aplican correctamente.

---

### Casos Límite

- ¿Qué ocurre cuando se intenta guardar un colaborador sin los datos obligatorios o con un RUT inválido o duplicado?
- ¿Qué ocurre cuando se intenta eliminar un departamento o un cargo que todavía tiene colaboradores asignados?
- ¿Qué ocurre cuando la fecha de término de un contrato es anterior a la fecha de inicio?
- ¿Qué ocurre cuando un colaborador tiene dos contratos vigentes con fechas superpuestas?
- ¿Qué ocurre cuando se intenta registrar un contrato con salario cero, negativo o con una moneda no válida?
- ¿Qué ocurre cuando se da de baja a un colaborador que tiene permisos pendientes o liquidaciones históricas?
- ¿Qué ocurre cuando un empleado solicita un cambio de cuenta bancaria sin adjuntar el certificado del banco?
- ¿Qué ocurre cuando una solicitud de vacaciones excede el saldo de días disponibles?
- ¿Qué ocurre cuando un colaborador envía dos solicitudes de ausencia con fechas superpuestas?
- ¿Qué ocurre cuando aprobar una ausencia deja al área por debajo de la dotación mínima?
- ¿Qué ocurre cuando se registra dos veces la asistencia del mismo colaborador en la misma fecha?
- ¿Qué ocurre cuando la hora de salida es anterior o igual a la hora de entrada?
- ¿Qué ocurre cuando se intenta registrar asistencia para un colaborador desvinculado o en una fecha futura?
- ¿Qué ocurre cuando se intenta liquidar a un colaborador sin contrato vigente en el período?
- ¿Qué ocurre cuando se intenta generar dos liquidaciones para el mismo colaborador y período?
- ¿Qué ocurre cuando se intenta modificar una liquidación de un período cerrado?
- ¿Qué ocurre cuando el sueldo líquido calculado resulta negativo?
- ¿Qué ocurre cuando no existen períodos de nómina, conceptos o contratos configurados?
- ¿Qué ocurre cuando un usuario sin rol autorizado intenta ver el salario o la papeleta de otro colaborador?
- ¿Qué ocurre cuando una jefatura intenta aprobar solicitudes de un área que no le corresponde?
- ¿Qué ocurre cuando el rol de un usuario cambia mientras tiene la sesión abierta?
- ¿Qué ocurre cuando un usuario intenta acceder directamente por URL a una pantalla para la que no tiene permiso?
- ¿Qué ocurre cuando el panel se abre con cero colaboradores, cero solicitudes o cero liquidaciones?
- ¿Se mantienen intactos los colaboradores, contratos, permisos, asistencias y liquidaciones al navegar entre pantallas?
- ¿Qué ocurre cuando se introducen caracteres HTML o scripts en nombres, comentarios o descripciones?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

#### Gestión de personal, estructura y contratos

- **FR-001**: El sistema DEBE permitir crear un registro en `employees` con `first_name`, `last_name`, `email`, `hire_date`, `department_id`, `job_title_id` y `employment_status`; el RUT DEBE ser un campo personalizado obligatorio y único.
- **FR-002**: El sistema DEBE permitir editar los datos de un colaborador existente en `employees` según los permisos del rol del usuario.
- **FR-003**: El sistema DEBE permitir dar de baja lógica a un colaborador actualizando `employees.employment_status`, retirándolo de las listas activas y de la búsqueda, sin eliminar su historial en `employee_contracts`, `attendance_records`, `leave_requests` ni `payslips`.
- **FR-004**: El sistema DEBE permitir buscar y filtrar colaboradores por nombre, RUT, correo electrónico, departamento, cargo y estado laboral.
- **FR-005**: El sistema DEBE mostrar una lista clara de colaboradores e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE validar los campos obligatorios, el formato del correo electrónico, el formato y la unicidad del RUT, las fechas y las referencias a departamentos y cargos antes de guardar.
- **FR-007**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria, un dato es inválido o no se puede completar una acción.
- **FR-008**: El sistema DEBE mantener los datos de colaboradores consistentes tras operaciones de creación, edición y baja.
- **FR-009**: El sistema DEBE permitir administrar los catálogos `departments` y `job_titles`, incluyendo su creación y edición.
- **FR-010**: El sistema DEBE impedir la eliminación de un registro de `departments` o `job_titles` que tenga colaboradores o registros asociados, ofreciendo una explicación clara.
- **FR-011**: El sistema DEBE permitir añadir, editar y cerrar registros de `employee_contracts` asociados a un colaborador, usando `contract_type`, `start_date`, `end_date`, `base_salary` y `currency_code`.
- **FR-012**: El sistema DEBE validar que `employee_contracts.end_date` sea posterior a `start_date`, que `base_salary` sea mayor que cero, que `currency_code` exista en `currencies` y que no existan contratos vigentes superpuestos para el mismo `employee_id`.
- **FR-013**: El sistema DEBE preservar el historial de `employee_contracts` cerrados y no eliminarlos físicamente cuando el colaborador tenga `payslips` asociados por `employee_id`.
- **FR-014**: El sistema DEBE mostrar un panel de inicio como vista inicial, con acciones rápidas para crear colaborador, crear contrato, revisar permisos, ejecutar nómina y buscar registros, junto con tarjetas calculadas desde `employees`, `leave_requests`, `attendance_records` y `payroll_runs`.
- **FR-015**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente con barra superior y barra lateral para Panel, Empleados, Contratos, Permisos, Asistencia, Nómina y Buscar, resaltando el módulo activo.
- **FR-016**: El sistema DEBE ofrecer una pantalla de búsqueda dedicada sobre `employees`, accesible desde la barra lateral y desde las acciones rápidas del panel, con filtros por nombre, RUT, correo, departamento, cargo y estado.
- **FR-017**: El sistema DEBE mantener los datos de colaboradores, contratos, permisos, asistencias y liquidaciones intactos y consistentes durante la navegación entre pantallas.
- **FR-018**: El sistema DEBE cargar la configuración del módulo (`ModuleConfig`) al arrancar y aplicarla en todas las pantallas, incluyendo nombre del módulo, terminología, campos personalizados, reglas y marca.
- **FR-019**: El sistema DEBE retroceder a los valores predeterminados del módulo base cuando no se proporcione configuración, e informar claramente cuando la configuración sea inválida o conflictiva.
- **FR-020**: El sistema DEBE derivar las etiquetas visibles para el usuario de la configuración del módulo, de modo que Entidad se presente como Empleado y Documento como Contrato en el contexto de RRHH y Planilla.
- **FR-021**: El sistema DEBE mostrar los campos personalizados declarados en la configuración, como RUT y datos bancarios, en formularios, listas y búsqueda, con el tipo de entrada y la validación correspondientes.
- **FR-022**: El sistema DEBE sanitizar el contenido introducido por los usuarios antes de renderizarlo en el DOM para prevenir ataques de inyección de scripts (XSS).

#### Autoservicio, altas y permisos

- **FR-023**: El sistema DEBE permitir al empleado actualizar sus datos personales y de contacto; el correo institucional, los datos contractuales y los datos salariales solo podrán ser modificados por RRHH.
- **FR-024**: El sistema DEBE dejar todo cambio de datos bancarios en estado pendiente de validación, exigir el certificado del banco y notificar al administrador de RRHH.
- **FR-025**: El sistema DEBE permitir registrar un nuevo colaborador validando los datos obligatorios y los documentos legales requeridos antes de crear su perfil.
- **FR-026**: El sistema DEBE generar un contrato editable con los datos precargados del colaborador a partir de una plantilla asociada al cargo.
- **FR-027**: El sistema DEBE mostrar a la jefatura las `leave_requests` pendientes de sus subordinados directos, identificados por `employees.manager_id`, junto con el saldo de días disponible.
- **FR-028**: El sistema DEBE permitir a la jefatura aprobar o rechazar una `leave_request` con un comentario opcional, actualizando `leave_requests.status`, el saldo del empleado y la cobertura del área.
- **FR-029**: El sistema DEBE detectar y advertir cuando una `leave_request` aprobada genere un conflicto de dotación mínima en el área, permitiendo rechazarla con un motivo.
- **FR-030**: El sistema DEBE notificar al empleado cada vez que cambie el estado de una solicitud, contrato o liquidación que le afecte.

#### Asistencia

- **FR-031**: El sistema DEBE permitir registrar la asistencia diaria en `attendance_records` con `employee_id`, `work_date`, `check_in`, `check_out` y `hours_worked`.
- **FR-032**: El sistema DEBE validar que exista un solo registro de `attendance_records` por `employee_id` y `work_date`, que `check_out` sea posterior a `check_in` y que `work_date` no sea futura.
- **FR-033**: El sistema DEBE permitir consultar `attendance_records` y `leave_requests` por colaborador, área y período, mostrando horas trabajadas y ausencias.
- **FR-034**: El sistema DEBE impedir el registro de asistencia para colaboradores con `employees.employment_status` de desvinculado, conservando sus registros históricos.

#### Nómina

- **FR-035**: El sistema DEBE permitir administrar registros de `payroll_runs` con `period_start`, `period_end`, `run_date` y `status` (borrador, calculado, aprobado o cerrado).
- **FR-036**: El sistema DEBE calcular la liquidación de un colaborador para un `payroll_run` a partir de su `employee_contracts` vigente y de los `payroll_concepts` configurados.
- **FR-037**: El sistema DEBE guardar el resultado en `payslips` y sus detalles en `payslip_lines`, mostrando `gross_pay`, la suma de deducciones y `net_pay`.
- **FR-038**: El sistema DEBE impedir la generación de más de un `payslip` por `employee_id` y `payroll_run_id`, y rechazar la liquidación de colaboradores sin `employee_contracts` vigente.
- **FR-039**: El sistema DEBE impedir la modificación de `payslips` cuando `payroll_runs.status` esté cerrado; solo un usuario autorizado podrá reabrir el período dejando registro de auditoría.
- **FR-040**: El sistema DEBE permitir al empleado consultar y descargar únicamente sus propios `payslips`.
- **FR-041**: El sistema DEBE permitir al encargado de nómina ejecutar y cerrar el `payroll_run`, generando una referencia en `journal_entries` con `source_module = 'payroll'` y `source_reference_id = payroll_run_id`.
- **FR-042**: El sistema DEBE calcular el costo de la última nómina desde `payslips` y el ausentismo desde `attendance_records` y `leave_requests` para las tarjetas del panel.

#### Seguridad, roles y datos sensibles

- **FR-043**: El sistema DEBE implementar cuatro roles: Administrador de RRHH, Encargado de Nómina, Jefatura o Supervisor y Empleado.
- **FR-044**: El sistema DEBE aplicar los permisos por rol y por alcance de datos; la jefatura solo podrá operar sobre sus subordinados directos.
- **FR-045**: El sistema DEBE restringir el salario base y los datos bancarios al administrador de RRHH, al encargado de nómina y al propio empleado; la jefatura no podrá ver el salario base.
- **FR-046**: El sistema DEBE restringir los datos médicos al administrador de RRHH y al propio empleado, sin acceso para la jefatura ni para el encargado de nómina.
- **FR-047**: El sistema DEBE denegar el acceso a pantallas, acciones y URLs no autorizadas, mostrando un mensaje claro y sin revelar datos sensibles ni la existencia de registros protegidos.
- **FR-048**: El sistema DEBE denegar el acceso a usuarios sin rol asignado y aplicar los cambios de rol en el siguiente inicio de sesión.
- **FR-049**: El sistema DEBE registrar una auditoría de aprobaciones de permisos, cambios de liquidaciones, cierres de período y cambios de roles, indicando usuario, acción y fecha.
- **FR-050**: El sistema DEBE enmascarar o truncar datos sensibles, como cuentas bancarias y montos salariales, en listas y exportaciones para los roles que no tienen acceso completo.

#### Calidad, integridad y rendimiento

- **FR-051**: El sistema DEBE mantener el renderizado de listas, la búsqueda y los cálculos ágiles para un conjunto de al menos 500 colaboradores.
- **FR-052**: Las estadísticas y los KPIs del panel DEBEN coincidir con los registros de `employees`, `leave_requests`, `attendance_records` y `payslips` almacenados.
- **FR-053**: El sistema DEBE persistir los datos en el almacenamiento local del navegador y mantenerlos intactos durante la navegación y recarga de pantallas.
- **FR-054**: El sistema DEBE mantener la consistencia de los datos tras altas, ediciones, bajas, aprobaciones de permisos, registros de asistencia y ejecuciones de nómina.
- **FR-055**: El sistema DEBE aplicar integridad referencial entre `employees`, `employee_contracts`, `leave_requests`, `attendance_records`, `payroll_runs`, `payslips` y `payslip_lines`, impidiendo registros huérfanos o referencias inexistentes.

### Reglas de Negocio Clave

- **RN-001**: `payslips.gross_pay` es la suma de los conceptos de tipo `earning` registrados en `payslip_lines`, y `payslips.net_pay` se calcula como `gross_pay` menos la suma de los conceptos de tipo `deduction`.
- **RN-002**: Cada colaborador puede tener como máximo un `payslip` por `payroll_run`.
- **RN-003**: El saldo de vacaciones es un valor derivado de la asignación anual configurada y de las `leave_requests` aprobadas; las ausencias con `leave_types.is_paid = false` se descuentan en la liquidación y las remuneradas no.
- **RN-004**: Un colaborador no puede tener dos `employee_contracts` vigentes con fechas superpuestas.
- **RN-005**: La baja de un colaborador es lógica mediante `employees.employment_status`: se retira de las listas activas y de la búsqueda, pero se conserva su historial legal y de nómina.
- **RN-006**: La jefatura solo puede ver y aprobar `leave_requests` de sus subordinados directos según `employees.manager_id`.
- **RN-007**: `employee_contracts.base_salary` y los datos bancarios personalizados son confidenciales y solo se muestran a los roles autorizados y al propio empleado.
- **RN-008**: La dotación mínima se configura por `departments.department_id` y se evalúa al aprobar permisos que afecten la cobertura del área.
- **RN-009**: Un `payroll_run` cerrado es inmutable; su reapertura requiere autorización y deja registro de auditoría.
- **RN-010**: Toda aprobación, cambio de rol, modificación de `payslips` y cierre de `payroll_run` debe quedar auditado en la capa de aplicación.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de `employees` y `employee_contracts` con campos adicionales específicos del dominio, como RUT, teléfono, dirección y datos bancarios, sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología de RRHH y Planilla sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial y eliminación lógica o en cascada según corresponda.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.
- **XR-006**: Integrarse con el ERP mediante `company_id`, `currency_code`, `cost_centers` y `journal_entries` de nómina.

### Requisitos de Integración con el ERP

- **IR-001**: `departments.company_id` y `payroll_runs.company_id` DEBEN referenciar `companies.company_id`.
- **IR-002**: `employee_contracts.currency_code` DEBE referenciar `currencies.currency_code`.
- **IR-003**: `cost_centers.department_id` DEBE referenciar `departments.department_id`; el cierre de `payroll_runs` DEBE generar una referencia en `journal_entries` con `source_module = 'payroll'` y `source_reference_id = payroll_run_id`.
- **IR-004**: `employees.employee_id` DEBE actuar como maestro transversal para `sales_orders.employee_id`, `purchase_orders.employee_id`, `quality_inspections.inspector_id` y `customers.assigned_employee_id`, entre otras referencias del ERP.
- **IR-005**: Los registros de `payslips` DEBEN poder asociarse a los centros de costo a través de `departments` y `cost_centers`, para imputar el gasto de personal.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

Las 14 tablas del módulo HR/Payroll y su diccionario completo se definen en `erp_data_model.md` (sección 1). `data-model.md` es la vista de negocio en español. Esta especificación las resume según su papel en el módulo:

| Tabla oficial | Descripción | Relaciones clave |
|---|---|---|
| `departments` | Área organizacional de la empresa. | `company_id` → `companies`; `manager_employee_id` → `employees`. |
| `job_titles` | Puesto de trabajo y banda jerárquica o salarial. | `job_title_id` referenciada por `employees`. |
| `employees` | Maestro del colaborador: nombres, correo, fecha de contratación y estado laboral. | `department_id`; `job_title_id`; `manager_id` (auto-referencia). |
| `employee_contracts` | Contrato laboral con tipo, vigencia, salario base y moneda. | `employee_id`; `currency_code` → `currencies`. |
| `leave_types` | Catálogo de tipos de ausencia y si son remunerados. | Referenciada por `leave_requests`. |
| `leave_requests` | Solicitud de vacaciones o permiso con fechas, estado y aprobador. | `employee_id`, `leave_type_id`, `approved_by` → `employees`. |
| `attendance_records` | Marcación diaria de entrada, salida y horas trabajadas. | `employee_id`. |
| `payroll_concepts` | Conceptos de ingreso o deducción aplicables a la nómina. | Referenciada por `payslip_lines`. |
| `payroll_runs` | Corrida mensual de nómina con fechas y estado. | `company_id` → `companies`; genera `journal_entries`. |
| `payslips` | Resultado de nómina por colaborador y período. | `payroll_run_id`, `employee_id`. |
| `payslip_lines` | Renglones de haberes y deducciones de una liquidación. | `payslip_id`, `concept_id`. |
| `benefits` | Catálogo de beneficios ofrecidos por la empresa. | Referenciada por `employee_benefits`. |
| `employee_benefits` | Inscripción de un colaborador en un beneficio. | `employee_id`, `benefit_id`. |
| `performance_reviews` | Evaluación periódica de un colaborador por su evaluador. | `employee_id`, `reviewer_id`. |
| **ModuleConfig** | Configuración del módulo base: nombre, etiquetas, campos personalizados, reglas y marca. | No es una tabla del ERP; se aplica transversalmente. |
| **Usuario / Rol** | Capa de seguridad que asigna un rol y un alcance de datos a cada usuario. | No modelada en `erp_data_model.md`; RBAC en la capa de aplicación. |

**Nota de modelado**: RUT, teléfono, dirección, datos bancarios y saldo de vacaciones no existen como columnas en `erp_data_model.md`. Se implementan como campos personalizados o valores derivados declarados en `ModuleConfig`, sin alterar el esquema oficial. `employees.email` es el único dato de contacto oficial; el teléfono y la dirección deben agregarse como extensión. Los documentos legales se almacenan como metadatos vinculados a `employees` o `employee_contracts`, reutilizando el patrón Documento del ERP base.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios de RRHH pueden registrar un nuevo colaborador completo y verlo en la lista en menos de 5 minutos.
- **SC-002**: Los usuarios pueden encontrar un colaborador existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de alta, edición, búsqueda, aprobación de permisos, registro de asistencia y liquidación sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de al menos 500 colaboradores sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar el panel, las pantallas de gestión y la búsqueda desde la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de colaboradores y contratos sigue operativa tras el rediseño del marco ERP y el panel, sin regresiones.
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión, permisos, asistencia y nómina sin perder ningún registro almacenado.
- **SC-008**: Un desarrollador puede producir el módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas y los KPIs del panel siempre coinciden con el número de colaboradores, solicitudes, asistencias y liquidaciones almacenados.
- **SC-011**: Una jefatura puede revisar y resolver una solicitud de vacaciones o permiso en menos de 2 minutos.
- **SC-012**: Un administrador puede generar un contrato con los datos del colaborador precargados en menos de 3 minutos y sin reingresar información manualmente.
- **SC-013**: Un encargado de nómina puede calcular y revisar la liquidación de un colaborador en menos de 3 minutos, con el desglose de conceptos visible.
- **SC-014**: El 100% de los `payslips` cumple `net_pay = gross_pay - deducciones` y `gross_pay` coincide con la suma de los `payslip_lines` de tipo `earning`.
- **SC-015**: El 100% de los intentos de acceso no autorizado se bloquea, muestra un mensaje claro y no expone datos sensibles.
- **SC-016**: El 100% de las aprobaciones de permisos, cambios de `payslips`, cierres de `payroll_runs` y cambios de rol queda registrado en la auditoría.
- **SC-017**: El sistema detecta el 100% de los registros duplicados de `attendance_records`, contratos superpuestos, `payslips` duplicados y conflictos de dotación mínima antes de guardar o cerrar.
- **SC-018**: Ningún empleado puede ver liquidaciones, datos bancarios o registros de otro colaborador.

## Suposiciones

- El módulo gestiona los datos de una única organización, con compatibilidad multiempresa mediante `company_id`.
- El ERP completo contiene otros módulos; esta especificación cubre únicamente las 14 tablas HR/Payroll y las tablas compartidas necesarias para la integración.
- El módulo se apoya en el módulo base de ERP para identidad, marcas de tiempo, integridad referencial y eliminación lógica o en cascada según corresponda.
- Las 14 tablas del módulo HR/Payroll y sus relaciones son las definidas en `erp_data_model.md`; `data-model.md` es la vista de negocio en español. El MVP se implementa sobre el frontend con datos simulados en JSON y `localStorage`.
- `ModuleConfig` mapea Entidad → `employees` y Documento → `employee_contracts`, y declara los campos personalizados RUT, teléfono, dirección, datos bancarios y reglas de validación.
- Existen cuatro roles: Administrador de RRHH, Encargado de Nómina, Jefatura o Supervisor y Empleado, cada uno con permisos y alcance de datos diferenciados.
- La jefatura solo puede operar sobre sus subordinados directos, identificados mediante `employees.manager_id`.
- `erp_data_model.md` no modela usuarios, roles ni permisos; el RBAC de US9 se implementa en la capa de aplicación.
- El salario base y los datos bancarios son confidenciales; la jefatura no tiene visibilidad del salario y el empleado solo ve sus propios registros.
- El saldo de vacaciones es un valor derivado de la asignación anual y de las `leave_requests` aprobadas; no requiere una tabla adicional en el ERP.
- La dotación mínima se configura por `departments.department_id` y se evalúa al aprobar permisos que afecten la cobertura.
- La liquidación es una simulación funcional del módulo, no un motor legal de impuestos, finiquitos o cotizaciones.
- Los documentos legales se almacenan como metadatos vinculados a `employees` o `employee_contracts`, reutilizando el patrón Documento del ERP base.
- Las notificaciones se muestran dentro de la aplicación y no requieren integración con correo electrónico externo.
- La versión inicial prioriza el panel, las fichas y contratos, la liquidación, los permisos y la seguridad; la interfaz de beneficios y evaluaciones de desempeño queda para una iteración posterior.
- Los datos se persisten en el almacenamiento local del navegador y no se ven afectados por la navegación entre pantallas.
- Solo se muestra una pantalla a la vez y la navegación ocurre dentro de la aplicación.
- El contenido introducido por los usuarios debe sanitizarse antes de renderizarse para prevenir ataques de inyección de scripts (XSS).

## Trazabilidad de Historias de Usuario

- **US1-US3**: se conservan de `spec.md` como historias genéricas base del ERP.
- **US4-US6**: provienen de la especificación del grupo (el anterior `spec02.md`) y cubren autoservicio, altas y contratos, y permisos.
- **US7-US8**: extensiones del dominio alineadas a las tablas `attendance_records` y `payroll_runs` de `erp_data_model.md`.
- **US9**: control de acceso basado en roles, alineado con la tabla RBAC de `plan.md`; no tiene tabla en `erp_data_model.md`.

## Trazabilidad con los Documentos del Proyecto

- `README.md`: define el problema de negocio y las entidades de personal, contratos, permisos, asistencia, beneficios, evaluaciones y nómina.
- `plan.md`: define los roles RBAC, el alcance del MVP, los KPIs del panel y las reglas de privacidad y sesgo.
- `erp_data_model.md`: fuente de verdad del modelo relacional oficial; define las 14 tablas HR/Payroll, sus columnas, claves primarias y claves foráneas.
- `data-model.md`: vista de negocio en español de las 14 tablas HR/Payroll, con nombres de entidades y atributos orientados al dominio.
- `spec.md`: aporta la estructura obligatoria de la especificación, las tres historias base y los patrones de configuración, navegación, validación y búsqueda del ERP base.



