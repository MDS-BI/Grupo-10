# Especificación de la Funcionalidad: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Rama de la funcionalidad**: `002-rrhh-planilla`  
**Creada**: 2026-11-02  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Gestionar la información del personal y la administración de recursos humanos: fichas laborales, contratos, permisos, asistencia, beneficios, evaluaciones y nóminas de pago, sobre el modelo relacional oficial del ERP."

## Propósito

Este proyecto implementa el módulo de Recursos Humanos y Planilla (HR / Payroll) sobre el módulo base de ERP. Reutiliza los patrones de datos maestros, documentos, navegación, validación, persistencia y búsqueda del ERP base, y los extiende con las 14 tablas del módulo HR/Payroll definidas en `data-model.md`: estructura organizacional, personal, contratos, permisos, asistencia, nómina, beneficios y desempeño.

El objetivo del MVP es centralizar las fichas laborales, formalizar contratos, gestionar permisos de forma trazable, registrar asistencia y calcular la liquidación mensual, con control de acceso por roles y protección de datos sensibles. La arquitectura de datos y las claves foráneas oficiales se detallan en `data-model.md`; el alcance técnico y los roles se detallan en `plan.md`.

## Alcance y relación con el módulo base

- El **panel de inicio**, el **marco de navegación**, la **búsqueda de entidades** y la **gestión de documentos** son capacidades del módulo base y se especifican en `../001-erp-base-module/spec.md`.
- Este módulo **reutiliza** esas capacidades y agrega las pantallas, reglas de negocio y datos de RRHH.
- El módulo base no se modifica para agregar reglas de RRHH: la extensión se realiza mediante configuración y módulos de dominio.
- Las historias de usuario de este documento están asignadas a los integrantes del grupo y son la fuente para `tasks.md`.

## Escenarios de Usuario y Pruebas *(obligatorio)*

> **Prioridades**: P1 = imprescindible para el MVP; P2 = necesaria para completar el alcance; P3 = mejora posterior.
> **Responsable**: integrante del grupo encargado de la historia y de sus tareas asociadas.

### Historia de Usuario 1 - Gestión de Departamentos de la Empresa (Prioridad: P1)

**Responsable**: Ángel Gidi

Como administrador de RRHH, quiero crear, editar y organizar los departamentos de la empresa, para estructurar correctamente la organización y asociar al personal.

**Por qué esta prioridad**: La estructura departamental es el cimiento organizativo; sin departamentos creados, no es posible asignar a los empleados ni estructurar la jerarquía de la compañía.

**Prueba Independiente**: Un administrador puede añadir un nuevo departamento con sus datos básicos, verificar que aparece en la lista, editar su nombre o jefe asignado, y ver los cambios reflejados de inmediato.

**Escenarios de Aceptación**:

1. **Dado** que el administrador está en la sección de estructura organizacional, **cuando** crea un nuevo departamento indicando un nombre y código válido, **entonces** el sistema guarda el registro y aparece en la lista de departamentos.
2. **Dado** un departamento ya existente, **cuando** el administrador edita el nombre o cambia el jefe de departamento asociado, **entonces** la información se actualiza correctamente.
3. **Dado** que se está creando un departamento, **cuando** se deja el nombre o el código obligatorio en blanco, **entonces** el sistema impide guardar y explica qué información falta.
4. **Dado** un departamento con empleados activos, **cuando** el administrador intenta eliminarlo, **entonces** el sistema bloquea la acción y ofrece reasignar a los empleados.

---

### Historia de Usuario 2 - Gestión del Catálogo de Cargos y Niveles (Prioridad: P1)

**Responsable**: Ángel Gidi

Como administrador de RRHH, quiero definir y actualizar los cargos de la empresa especificando su nombre y nivel de grado, para estandarizar los puestos de trabajo y asignarlos correctamente en los contratos del personal.

**Por qué esta prioridad**: Mantener un catálogo de cargos estructurado es indispensable para la formalización contractual, la equidad salarial y la correcta definición de funciones dentro de la organización.

**Prueba Independiente**: Un administrador puede registrar un nuevo cargo con su nivel de grado, verificar que aparece en el catálogo, modificar sus detalles o eliminarlo si no está en uso.

**Escenarios de Aceptación**:

1. **Dado** que el administrador visualiza el catálogo de cargos, **cuando** añade un nuevo cargo indicando nombre y nivel de grado, **entonces** el registro queda guardado y disponible para asignación.
2. **Dado** un cargo existente que ha cambiado de categoría, **cuando** el administrador edita su nivel de grado, **entonces** la actualización se refleja correctamente en el sistema.
3. **Dado** un cargo vinculado activamente a contratos de empleados, **cuando** se intenta eliminar, **entonces** el sistema bloquea la acción para proteger la integridad de los datos laborales.

---

### Historia de Usuario 3 - Actualización de datos personales y de contacto (Prioridad: P1)

**Responsable**: José Sellán

Como empleado, quiero actualizar mis datos personales, de contacto y bancarios para que la empresa pueda comunicarse conmigo correctamente y emitir mis pagos sin errores.

**Por qué esta prioridad**: Mantener la información de los colaboradores al día previene problemas administrativos, de nómina y asegura una comunicación fluida y legalmente válida.

**Prueba Independiente**: Un empleado puede modificar su dirección o información de contacto en su perfil, y los cambios se reflejan inmediatamente tanto en su vista como en el registro accesible para RRHH.

**Escenarios de Aceptación**:

1. **Dada** la ficha del perfil del empleado, **cuando** el usuario modifica su número de teléfono o dirección, **entonces** la nueva información se guarda de forma segura y se muestra actualizada en pantalla.
2. **Dado** que el empleado necesita cambiar su cuenta bancaria para el depósito de su sueldo, **cuando** ingresa los nuevos datos y adjunta el certificado del banco, **entonces** la solicitud queda pendiente de validación y se notifica al administrador de RRHH.
3. **Dado** un empleado con una solicitud bancaria pendiente, **cuando** intenta enviar otra sin que la anterior sea resuelta, **entonces** el sistema lo impide y muestra el estado de la solicitud existente.
4. **Dado** un empleado autenticado, **cuando** intenta modificar su sueldo base o su rol, **entonces** el sistema bloquea la acción por no ser un dato de autoservicio.

---

### Historia de Usuario 4 - Gestión de altas y contratos de nuevos colaboradores (Prioridad: P1)

**Responsable**: José Sellán

Como administrador de RRHH, quiero registrar un nuevo colaborador y generar su contrato de trabajo para mantener formalizada su incorporación a la empresa.

**Por qué esta prioridad**: Un proceso de alta ágil y estructurado asegura el cumplimiento legal laboral, la correcta integración a la nómina y el acceso oportuno del colaborador a los sistemas internos.

**Prueba Independiente**: Un administrador de RRHH puede ingresar los datos de un nuevo empleado, adjuntar los documentos legales requeridos y generar el contrato basado en una plantilla predefinida.

**Escenarios de Aceptación**:

1. **Dado** el formulario de ingreso de personal, **cuando** el administrador completa los datos obligatorios (RUT, cargo, sueldo, fecha de inicio) y sube los documentos requeridos, **entonces** el perfil del empleado se crea exitosamente en el sistema.
2. **Dada** la creación del perfil, **cuando** el administrador selecciona la plantilla del contrato correspondiente al cargo, **entonces** el sistema genera un documento editable y con los datos precargados del colaborador.
3. **Dado** un contrato con fecha de término anterior a la fecha de inicio, **cuando** se intenta guardar, **entonces** el sistema lo rechaza con un mensaje claro.
4. **Dado** un empleado que ya tiene un contrato vigente, **cuando** se intenta crear un segundo contrato activo para el mismo período, **entonces** el sistema lo impide y explica el conflicto.

---

### Historia de Usuario 5 - Aprobación de solicitudes de vacaciones y permisos (Prioridad: P1)

**Responsable**: Ricardo Cuevas

Como jefatura o supervisor, quiero revisar y aprobar o rechazar las solicitudes de vacaciones y permisos de mi equipo para asegurar la continuidad operacional del área.

**Por qué esta prioridad**: Gestionar las ausencias de manera oportuna evita cuellos de botella en la operación diaria y mantiene una planificación transparente y justa del personal a cargo.

**Prueba Independiente**: Una jefatura puede visualizar las solicitudes pendientes de su equipo, verificar los días disponibles en el saldo y aprobarlas o rechazarlas con un comentario opcional.

**Escenarios de Aceptación**:

1. **Dada** una solicitud de vacaciones enviada por un miembro del equipo, **cuando** el supervisor revisa las fechas y el saldo de días disponibles, **entonces** puede hacer clic en "Aprobar" y el sistema actualiza el calendario y el saldo del empleado.
2. **Dada** una solicitud que genera un conflicto de dotación mínima en el área, **cuando** el supervisor la rechaza indicando un motivo, **entonces** la solicitud cambia de estado y se notifica al empleado con el comentario ingresado.
3. **Dada** una solicitud con fecha de término anterior a la fecha de inicio, **cuando** se intenta enviar, **entonces** el sistema la rechaza antes de llegar a la bandeja de aprobación.
4. **Dadas** dos solicitudes del mismo empleado con fechas superpuestas, **cuando** se intenta crear la segunda, **entonces** el sistema la bloquea y muestra el conflicto.

---

### Historia de Usuario 6 - Registrar y consultar la asistencia diaria (Prioridad: P2)

**Responsable**: Lucas Lemarie

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

### Historia de Usuario 7 - Ejecutar y consultar la liquidación de nómina (Prioridad: P1)

**Responsable**: Lucas Lemarie

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
7. **Dado** un período sin liquidaciones, **cuando** se ejecuta la corrida, **entonces** el sistema informa que no hay colaboradores elegibles y no genera registros vacíos.

---

### Historia de Usuario 8 - Control de acceso basado en roles (Prioridad: P1)

**Responsable**: Benjamín (valdechito)

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

### Historia de Usuario 9 - Validación de Asistencia y Aprobación de Horas Extras (Prioridad: P2)

**Responsable**: Vicente Morales

Como jefatura directa, quiero visualizar y aprobar los registros de asistencia ya finalizados de mi equipo, para autorizar las horas extras y asegurar que el cálculo sea exacto antes del proceso de nómina.

**Por qué esta prioridad**: Actúa como un paso de control de calidad sobre la asistencia registrada (HU6), garantizando que las horas extras estén validadas por una jefatura sin exponer datos salariales confidenciales entre pares.

**Prueba Independiente**: La jefatura revisa los registros diarios de su equipo, los aprueba y el sistema consolida el concepto de horas extras ocultando información confidencial como el RUT o sueldo base.

**Escenarios de Aceptación**:

1. **Dado** un conjunto de registros de asistencia completados por los empleados, **cuando** la jefatura ingresa al panel de validación, **entonces** el sistema filtra y muestra exclusivamente los registros de su personal a cargo.
2. **Dado** un registro pendiente de revisión, **cuando** la jefatura lo aprueba, **entonces** el sistema marca las horas extras como autorizadas y consolidadas para alimentar las líneas de liquidación del mes.
3. **Dada** la interacción de la jefatura con el panel de validación, **cuando** revisa los perfiles, **entonces** la interfaz restringe visualmente el acceso a atributos sensibles del trabajador (como el sueldo base o datos bancarios).
4. **Dado** un registro de horas extras ya aprobado, **cuando** se intenta aprobar nuevamente, **entonces** el sistema no duplica el concepto en la liquidación.

---

### Historia de Usuario 10 - Inscripción y gestión de beneficios (Prioridad: P2)

**Responsable**: Ricardo Cuevas

Como administrador de RRHH, quiero administrar el catálogo de beneficios e inscribir a los colaboradores para que accedan a los planes ofrecidos por la empresa y su costo quede reflejado en la gestión de personal.

**Por qué esta prioridad**: Los beneficios son parte de la propuesta laboral y del costo de personal; su registro permite auditar inscripciones y consolidar el gasto asociado.

**Prueba Independiente**: Un administrador crea un beneficio, inscribe a un colaborador y verifica que la inscripción aparece en su ficha; un intento de inscripción duplicada se rechaza.

**Escenarios de Aceptación**:

1. **Dado** el catálogo de beneficios, **cuando** el administrador crea un beneficio con nombre, proveedor y costo, **entonces** queda disponible para inscripción.
2. **Dada** la ficha de un colaborador, **cuando** el administrador lo inscribe en un beneficio con fecha de inscripción, **entonces** la inscripción se guarda y se muestra en su historial.
3. **Dado** un colaborador ya inscrito en un beneficio activo, **cuando** se intenta inscribirlo nuevamente, **entonces** el sistema lo impide y muestra la inscripción existente.
4. **Dado** un beneficio con inscripciones activas, **cuando** el administrador intenta eliminarlo, **entonces** el sistema bloquea la acción y sugiere finalizar las inscripciones primero.

---

### Historia de Usuario 11 - Registro de evaluaciones de desempeño (Prioridad: P2)

**Responsable**: Vicente Morales

Como jefatura, quiero registrar evaluaciones periódicas de desempeño de mis colaboradores directos para dejar evidencia objetiva de su rendimiento y acordar mejoras.

**Por qué esta prioridad**: Las evaluaciones permiten comparar desempeño con metas acordadas y reducen la subjetividad; complementan la gestión de personal sin bloquear el MVP.

**Prueba Independiente**: Una jefatura registra una evaluación para un subordinado directo con una calificación entre 1.00 y 5.00 y comentarios; el colaborador la ve en su ficha y una evaluación fuera de rango se rechaza.

**Escenarios de Aceptación**:

1. **Dado** un supervisor con subordinados directos, **cuando** registra una evaluación con fecha, calificación y comentarios, **entonces** la evaluación se guarda y queda asociada al colaborador y al evaluador.
2. **Dado** un colaborador autenticado, **cuando** consulta sus evaluaciones, **entonces** solo ve las propias.
3. **Dado** un valor de calificación menor que 1.00 o mayor que 5.00, **cuando** se intenta guardar, **entonces** el sistema lo rechaza con un mensaje claro.
4. **Dado** un colaborador que no es subordinado directo del evaluador, **cuando** se intenta evaluar, **entonces** el sistema lo impide.

---

### Casos Límite

- ¿Qué ocurre cuando se intenta crear un departamento con un código ya existente?
- ¿Qué ocurre cuando se elimina un cargo que está asignado a un contrato vigente?
- ¿Qué ocurre cuando un empleado no tiene supervisor asignado?
- ¿Qué ocurre cuando se intenta asignar como supervisor a la misma persona o se genera un ciclo de supervisión?
- ¿Qué ocurre cuando un contrato no tiene fecha de término y el tipo de contrato exige una?
- ¿Qué ocurre cuando un empleado tiene dos contratos vigentes superpuestos?
- ¿Qué ocurre cuando una solicitud de permiso supera el saldo disponible?
- ¿Qué ocurre cuando dos solicitudes de permiso del mismo empleado se superponen?
- ¿Qué ocurre cuando se registra asistencia para un día futuro?
- ¿Qué ocurre cuando la hora de salida es anterior a la hora de entrada?
- ¿Qué ocurre cuando se ejecuta la nómina de un período sin colaboradores elegibles?
- ¿Qué ocurre cuando se reabre un período cerrado y se vuelve a calcular?
- ¿Qué ocurre cuando un usuario sin rol intenta acceder por URL directa?
- ¿Qué ocurre cuando un supervisor intenta ver el sueldo base de un subordinado?
- ¿Qué ocurre cuando se elimina un empleado con liquidaciones históricas?
- ¿Qué ocurre cuando se intenta inscribir a un empleado en un beneficio ya activo?
- ¿Qué ocurre cuando se evaluúa a un colaborador que no es subordinado directo?
- ¿Qué ocurre cuando los datos de localStorage están corruptos o incompletos?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

#### Organización y personal

- **FR-001**: El sistema DEBE permitir crear, editar y eliminar departamentos con nombre, código, empresa y jefe de departamento.
- **FR-002**: El sistema DEBE validar que el nombre y el código del departamento sean obligatorios y que el código no se repita.
- **FR-003**: El sistema DEBE impedir eliminar un departamento con empleados activos y ofrecer reasignarlos.
- **FR-004**: El sistema DEBE permitir crear, editar y eliminar cargos con nombre y nivel de grado.
- **FR-005**: El sistema DEBE impedir eliminar un cargo vinculado a contratos vigentes.
- **FR-006**: El sistema DEBE permitir registrar y editar empleados con identificador único, nombres, apellidos, correo, fecha de contratación, estado laboral, departamento, cargo y supervisor.
- **FR-007**: El sistema DEBE validar los campos obligatorios del empleado, el formato del correo, la coherencia de fechas y que el supervisor pertenezca a la misma organización.
- **FR-008**: El sistema DEBE impedir que un empleado sea su propio supervisor o que se generen ciclos de supervisión.
- **FR-009**: El sistema DEBE permitir al empleado actualizar sus datos de contacto y dirección, reflejando los cambios en su ficha y en la vista de RRHH.
- **FR-010**: El sistema DEBE exigir validación de RRHH para cambios de datos bancarios y registrar la solicitud con estado y auditoría.
- **FR-011**: El sistema DEBE impedir que el empleado modifique por autoservicio su sueldo base, su cargo o su rol.

#### Contratos

- **FR-012**: El sistema DEBE permitir registrar contratos con empleado, tipo de contrato, fecha de inicio, fecha de término, salario base y moneda.
- **FR-013**: El sistema DEBE validar que la fecha de término sea igual o posterior a la fecha de inicio, que el salario sea mayor que cero y que la moneda sea válida.
- **FR-014**: El sistema DEBE impedir más de un contrato vigente superpuesto para el mismo empleado.
- **FR-015**: El sistema DEBE generar un contrato editable a partir de una plantilla con los datos precargados del colaborador.
- **FR-016**: El sistema DEBE conservar el historial de contratos finalizados sin eliminarlos.

#### Permisos y asistencia

- **FR-017**: El sistema DEBE administrar los tipos de permiso con nombre y marca de si son remunerados.
- **FR-018**: El sistema DEBE permitir registrar solicitudes de permiso con empleado, tipo, fechas, estado y aprobador.
- **FR-019**: El sistema DEBE validar fechas, superposición de solicitudes, saldo disponible y dotación mínima del área.
- **FR-020**: El sistema DEBE permitir a la jefatura aprobar o rechazar solicitudes con un comentario y notificar al empleado.
- **FR-021**: El sistema DEBE actualizar el calendario y el saldo del empleado cuando una solicitud es aprobada.
- **FR-022**: El sistema DEBE registrar la asistencia diaria con empleado, fecha laboral, hora de entrada, hora de salida y horas trabajadas calculadas.
- **FR-023**: El sistema DEBE impedir más de un registro de asistencia por empleado y fecha.
- **FR-024**: El sistema DEBE rechazar registros con hora de salida anterior o igual a la hora de entrada y registros de empleados desvinculados.
- **FR-025**: El sistema DEBE entregar un resumen de horas trabajadas, ausencias y ausentismo por área y período.
- **FR-026**: El sistema DEBE permitir a la jefatura validar asistencia y horas extras solo de sus subordinados directos.
- **FR-027**: El sistema DEBE ocultar a la jefatura los datos salariales, bancarios y médicos de los colaboradores.

#### Nómina

- **FR-028**: El sistema DEBE administrar períodos de nómina con fecha de inicio, fecha de término, fecha de ejecución y estado.
- **FR-029**: El sistema DEBE administrar conceptos de nómina clasificados como haber o deducción.
- **FR-030**: El sistema DEBE calcular el total de haberes, el total de deducciones y el sueldo líquido de cada colaborador elegible.
- **FR-031**: El sistema DEBE guardar el detalle de la liquidación por concepto y cumplir que `sueldo_liquido = total_haberes - deducciones`.
- **FR-032**: El sistema DEBE impedir más de una liquidación por colaborador y período.
- **FR-033**: El sistema DEBE rechazar la liquidación de colaboradores sin contrato vigente en el período.
- **FR-034**: El sistema DEBE impedir modificar liquidaciones de un período cerrado; solo un usuario autorizado puede reabrirlo dejando auditoría.
- **FR-035**: El sistema DEBE permitir al colaborador consultar y descargar solo sus propias papeletas de pago.
- **FR-036**: El sistema DEBE consolidar el costo de nómina por período y por departamento.

#### Beneficios y desempeño

- **FR-037**: El sistema DEBE administrar el catálogo de beneficios con nombre, proveedor y costo.
- **FR-038**: El sistema DEBE permitir inscribir colaboradores en beneficios con fecha de inscripción y conservar el historial.
- **FR-039**: El sistema DEBE impedir inscripciones duplicadas o activas simultáneas del mismo colaborador en el mismo beneficio.
- **FR-040**: El sistema DEBE impedir eliminar un beneficio con inscripciones activas.
- **FR-041**: El sistema DEBE registrar evaluaciones de desempeño con colaborador, evaluador, fecha, calificación entre 1.00 y 5.00 y comentarios.
- **FR-042**: El sistema DEBE permitir evaluar solo a subordinados directos y mostrar al colaborador solo sus propias evaluaciones.
- **FR-043**: El sistema DEBE consolidar el costo de beneficios por colaborador y por período.

#### Seguridad, datos y plataforma

- **FR-044**: El sistema DEBE implementar los roles Administrador de RRHH, Encargado de Nómina, Jefatura/Supervisor y Empleado.
- **FR-045**: El sistema DEBE restringir pantallas, acciones y datos según el rol, incluso ante acceso directo por URL.
- **FR-046**: El sistema DEBE denegar el acceso a usuarios sin rol asignado.
- **FR-047**: El sistema DEBE aplicar los cambios de rol en el siguiente inicio de sesión del usuario afectado.
- **FR-048**: El sistema DEBE registrar auditoría de cambios de salario, datos bancarios, roles y reapertura de períodos.
- **FR-049**: El sistema DEBE sanitizar los datos ingresados por el usuario antes de renderizarlos para prevenir XSS.
- **FR-050**: El sistema DEBE registrar tipos y días de ausencia médica sin almacenar diagnósticos clínicos.
- **FR-051**: El sistema DEBE persistir las 14 entidades en `localStorage` y cargar datos semilla para la demo.
- **FR-052**: El sistema DEBE ofrecer búsqueda y filtros por nombre, código, área, cargo, estado y período.
- **FR-053**: El sistema DEBE mostrar indicadores de dotación activa, distribución por departamento, ausentismo y costo de nómina.
- **FR-054**: El sistema DEBE mantener la integridad referencial al crear, editar y eliminar registros, incluyendo la eliminación en cascada cuando corresponda.
- **FR-055**: El sistema DEBE ser usable con al menos 500 empleados y 500 registros de asistencia sin pérdida de funcionalidad.
- **FR-056**: El sistema DEBE ser responsivo y accesible con etiquetas, foco de teclado, contraste y mensajes de error claros.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **DEPARTAMENTOS**: área organizacional con nombre, empresa y jefe; agrupa empleados.
- **CARGOS**: puesto de trabajo con nombre y nivel de grado; se asigna a empleados y contratos.
- **EMPLEADOS**: ficha laboral con identificación, contacto, fecha de contratación, estado, departamento, cargo y supervisor.
- **CONTRATOS_EMPLEADO**: vínculo contractual con tipo, vigencia, salario base y moneda.
- **BENEFICIOS**: catálogo de beneficios con proveedor y costo.
- **BENEFICIOS_EMPLEADO**: inscripción de un empleado en un beneficio, con fecha de inscripción.
- **REGISTROS_ASISTENCIA**: marcación diaria con entrada, salida y horas trabajadas.
- **TIPOS_PERMISO**: catálogo de ausencias con marca de remuneración.
- **SOLICITUDES_PERMISO**: solicitud de ausencia con fechas, estado y aprobador.
- **PERIODOS_NOMINA**: período mensual de cálculo con fechas y estado.
- **CONCEPTOS_NOMINA**: concepto de haber o deducción aplicable a una liquidación.
- **LIQUIDACIONES**: resultado de nómina por empleado y período con total de haberes y sueldo líquido.
- **DETALLES_LIQUIDACION**: línea de una liquidación con concepto y monto.
- **EVALUACIONES_DESEMPENO**: evaluación periódica con evaluador, fecha, calificación y comentarios.

Las relaciones, claves primarias y foráneas se detallan en `data-model.md` y en el diagrama `modelo-entidadrelacion.png`.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Un administrador puede crear un empleado con su contrato en menos de 3 minutos.
- **SC-002**: El cálculo de nómina de 50 colaboradores se completa en menos de 5 segundos.
- **SC-003**: Al menos el 90% de los usuarios de prueba completan las tareas principales sin ayuda.
- **SC-004**: El sistema sigue siendo usable con 500 empleados y 500 registros de asistencia.
- **SC-005**: El 100% de los intentos de acceso fuera de rol se bloquean sin exponer datos sensibles.
- **SC-006**: El 100% de las liquidaciones cumple `sueldo_liquido = total_haberes - deducciones`.
- **SC-007**: El 100% de los registros de asistencia duplicados o inválidos se rechazan.
- **SC-008**: Una aprobación de permiso actualiza el estado y el saldo del empleado en menos de 2 segundos.
- **SC-009**: Los indicadores del panel coinciden con los datos almacenados en el 100% de las verificaciones.
- **SC-010**: La documentación de `spec.md`, `plan.md`, `data-model.md` y `tasks.md` no contiene referencias rotas ni historias sin tareas asociadas.

## Suposiciones

- El módulo se ejecuta en un único espacio de trabajo y no requiere multiempresa real; `empresa_id` se usa como dato de contexto.
- La persistencia es local (`localStorage`) y los datos semilla representan las 14 entidades.
- No hay backend ni autenticación real: los usuarios y roles se simulan con datos de demo.
- El salario base y los datos bancarios son datos sensibles y solo se muestran a roles autorizados.
- Las ausencias médicas se registran por tipo y días, sin diagnósticos ni información clínica.
- La moneda principal es CLP; el modelo deja `codigo_moneda` preparado para otras monedas.
- Las horas extras se calculan a partir de las horas trabajadas registradas y aprobadas por la jefatura.
- La nómina del MVP es una simulación: no incluye integración contable real ni pago efectivo.
- Los documentos de contrato se generan como texto editable en el navegador, sin firma electrónica.
- La interfaz reutiliza el marco y los componentes del módulo base (`001`) sin modificarlos.
- Los datos de demo se pueden restablecer desde la aplicación para repetir la presentación.
- El navegador objetivo es una versión moderna de Chrome, Edge o Firefox.
