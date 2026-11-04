# Especificación de la Funcionalidad: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Rama de la funcionalidad**: `002-rrhh-planilla`  
**Creada**: 2026-11-02  
**Estado**: Implementado (MVP) — validado 2026-11-03  
**Entrada**: Descripción del usuario: "Gestionar la información del personal y la administración de recursos humanos: fichas laborales, contratos, permisos, asistencia, beneficios, evaluaciones y nóminas de pago, sobre el modelo relacional oficial del ERP."

## Propósito

Este proyecto implementa el módulo de Recursos Humanos y Planilla (HR / Payroll) sobre el módulo base de ERP. Reutiliza los patrones de datos maestros, documentos, navegación, validación, persistencia y búsqueda del ERP base, y los extiende con las 14 tablas del módulo HR/Payroll definidas en `data-model.md`: estructura organizacional, personal, contratos, permisos, asistencia, nómina, beneficios y desempeño.

Además de las 14 entidades oficiales, el MVP usa dos colecciones de soporte que no forman parte del MER oficial: `USUARIOS` (cuentas, roles y vínculo con la ficha del empleado) y `AUDITORIA` (trazabilidad de acciones sensibles). Ambas se detallan en `data-model.md`.

El objetivo del MVP es centralizar las fichas laborales, formalizar contratos, gestionar permisos de forma trazable, registrar asistencia y calcular la liquidación mensual, con control de acceso por roles y protección de datos sensibles. La arquitectura de datos y las claves foráneas oficiales se detallan en `data-model.md`; el alcance técnico y los roles se detallan en `plan.md`.

## Alcance y relación con el módulo base

- El **panel de inicio**, el **marco de navegación**, la **búsqueda de entidades** y la **gestión de documentos** son capacidades del módulo base y se especifican en `../001-erp-base-module/spec.md`.
- Este módulo **reutiliza** esas capacidades y agrega las pantallas, reglas de negocio y datos de RRHH.
- El módulo base no se modifica para agregar reglas de RRHH: la extensión se realiza mediante configuración y módulos de dominio.
- Las historias de usuario de este documento son la fuente para `tasks.md`.

## Escenarios de Usuario y Pruebas *(obligatorio)*

> **Prioridades**: P1 = imprescindible para el MVP; P2 = necesaria para completar el alcance; P3 = mejora posterior.

### Historia de Usuario 1 - Gestión de Departamentos de la Empresa (Prioridad: P1)

Como administrador de RRHH, quiero crear, editar y organizar los departamentos de la empresa, para estructurar correctamente la organización y asociar al personal.

**Por qué esta prioridad**: La estructura departamental es el cimiento organizativo; sin departamentos creados, no es posible asignar a los empleados ni estructurar la jerarquía de la compañía.

**Prueba Independiente**: Un administrador puede añadir un nuevo departamento con sus datos básicos, verificar que aparece en la lista, editar su nombre o jefe asignado, y ver los cambios reflejados de inmediato.

**Escenarios de Aceptación**:

1. **Dado** que el administrador está en la sección de estructura organizacional, **cuando** crea un nuevo departamento indicando un nombre y código válido, **entonces** el sistema guarda el registro y aparece en la lista de departamentos.
2. **Dado** un departamento ya existente, **cuando** el administrador edita el nombre o cambia el jefe de departamento asociado, **entonces** la información se actualiza correctamente.
3. **Dado** que se está creando un departamento, **cuando** se deja el nombre o el código obligatorio en blanco, **entonces** el sistema impide guardar y explica qué información falta.
4. **Dado** un departamento con empleados o cargos asociados, **cuando** el administrador intenta eliminarlo, **entonces** el sistema bloquea la acción y ofrece reasignar los empleados y cargos a otro departamento.

---

### Historia de Usuario 2 - Gestión del Catálogo de Cargos y Niveles (Prioridad: P1)

Como administrador de RRHH, quiero definir y actualizar los cargos de la empresa especificando su nombre y nivel de grado, para estandarizar los puestos de trabajo y asignarlos correctamente en los contratos del personal.

**Por qué esta prioridad**: Mantener un catálogo de cargos estructurado es indispensable para la formalización contractual, la equidad salarial y la correcta definición de funciones dentro de la organización.

**Prueba Independiente**: Un administrador puede registrar un nuevo cargo con su nivel de grado, verificar que aparece en el catálogo, modificar sus detalles o eliminarlo si no está en uso.

**Escenarios de Aceptación**:

1. **Dado** que el administrador visualiza el catálogo de cargos, **cuando** añade un nuevo cargo indicando nombre y nivel de grado, **entonces** el registro queda guardado y disponible para asignación.
2. **Dado** un cargo existente que ha cambiado de categoría, **cuando** el administrador edita su nivel de grado, **entonces** la actualización se refleja correctamente en el sistema.
3. **Dado** un cargo asignado a empleados con contrato vigente o con registros laborales históricos, **cuando** se intenta eliminar, **entonces** el sistema bloquea la acción para proteger la integridad de los datos laborales.

---

### Historia de Usuario 3 - Actualización de datos personales y de contacto (Prioridad: P1)

Como empleado, quiero actualizar mis datos personales, de contacto y bancarios para que la empresa pueda comunicarse conmigo correctamente y emitir mis pagos sin errores.

**Por qué esta prioridad**: Mantener la información de los colaboradores al día previene problemas administrativos, de nómina y asegura una comunicación fluida y legalmente válida.

**Prueba Independiente**: Un empleado puede modificar su dirección o información de contacto en su perfil, y los cambios se reflejan inmediatamente tanto en su vista como en el registro accesible para RRHH.

**Escenarios de Aceptación**:

1. **Dada** la ficha del perfil del empleado, **cuando** el usuario modifica su correo electrónico, número de teléfono o dirección, **entonces** la nueva información se guarda de forma segura y se muestra actualizada en pantalla.
2. **Dado** que el empleado necesita cambiar su cuenta bancaria para el depósito de su sueldo, **cuando** ingresa los nuevos datos y adjunta el certificado del banco, **entonces** la solicitud queda pendiente de validación y se notifica al administrador de RRHH.
3. **Dado** un empleado con una solicitud bancaria pendiente, **cuando** intenta enviar otra sin que la anterior sea resuelta, **entonces** el sistema lo impide y muestra el estado de la solicitud existente.
4. **Dado** un empleado autenticado, **cuando** intenta modificar su sueldo base, su cargo o su rol, **entonces** el sistema bloquea la acción por no ser un dato de autoservicio.
5. **Dado** un empleado que cambia su correo electrónico, **cuando** ingresa uno que ya pertenece a otro colaborador, **entonces** el sistema rechaza el cambio y explica que el correo debe ser único.

---

### Historia de Usuario 4 - Gestión de altas y contratos de nuevos colaboradores (Prioridad: P1)

Como administrador de RRHH, quiero registrar un nuevo colaborador y generar su contrato de trabajo para mantener formalizada su incorporación a la empresa.

**Por qué esta prioridad**: Un proceso de alta ágil y estructurado asegura el cumplimiento legal laboral, la correcta integración a la nómina y el acceso oportuno del colaborador a los sistemas internos.

**Prueba Independiente**: Un administrador de RRHH puede ingresar los datos de un nuevo empleado, adjuntar los documentos legales requeridos y generar el contrato basado en una plantilla predefinida.

**Escenarios de Aceptación**:

1. **Dado** el formulario de ingreso de personal, **cuando** el administrador completa los datos obligatorios (RUT, cargo, sueldo, fecha de inicio) y sube los documentos requeridos, **entonces** el perfil del empleado se crea exitosamente en el sistema.
2. **Dada** la creación del perfil, **cuando** el administrador genera el contrato, **entonces** el sistema aplica la plantilla predefinida del módulo (parametrizada por cargo y tipo de contrato) y genera un documento editable con los datos precargados del colaborador.
3. **Dado** un contrato con fecha de término anterior a la fecha de inicio, **cuando** se intenta guardar, **entonces** el sistema lo rechaza con un mensaje claro.
4. **Dado** un empleado que ya tiene un contrato vigente, **cuando** se intenta crear un segundo contrato activo para el mismo período, **entonces** el sistema lo impide y explica el conflicto.

---

### Historia de Usuario 5 - Aprobación de solicitudes de vacaciones y permisos (Prioridad: P1)

Como jefatura o supervisor, quiero revisar y aprobar o rechazar las solicitudes de vacaciones y permisos de mi equipo para asegurar la continuidad operacional del área.

**Por qué esta prioridad**: Gestionar las ausencias de manera oportuna evita cuellos de botella en la operación diaria y mantiene una planificación transparente y justa del personal a cargo.

**Prueba Independiente**: Una jefatura puede visualizar las solicitudes pendientes de su equipo, verificar los días disponibles en el saldo y aprobarlas o rechazarlas con un comentario opcional.

**Escenarios de Aceptación**:

1. **Dada** una solicitud de vacaciones enviada por un miembro del equipo, **cuando** el supervisor revisa las fechas y el saldo de días disponibles, **entonces** puede hacer clic en "Aprobar" y el sistema actualiza el calendario y el saldo del empleado.
2. **Dada** una solicitud que dejaría al área sin al menos un empleado activo disponible (dotación mínima = 1), **cuando** el supervisor intenta aprobarla, **entonces** el sistema la rechaza y explica el conflicto; si el supervisor la rechaza manualmente, debe indicar un motivo y se notifica al empleado con el comentario ingresado.
3. **Dada** una solicitud con fecha de término anterior a la fecha de inicio, **cuando** se intenta enviar, **entonces** el sistema la rechaza antes de llegar a la bandeja de aprobación.
4. **Dadas** dos solicitudes del mismo empleado con fechas superpuestas, **cuando** se intenta crear la segunda, **entonces** el sistema la bloquea y muestra el conflicto.

---

### Historia de Usuario 6 - Registrar y consultar la asistencia diaria (Prioridad: P2)

Como jefatura o encargado de nómina, quiero registrar y consultar la asistencia diaria y las horas trabajadas del personal para alimentar los indicadores de ausentismo y el cálculo de la nómina.

**Por qué esta prioridad**: Los registros de asistencia son la fuente de verdad para medir ausentismo y horas efectivas; sin ellos, los indicadores del panel y las liquidaciones carecen de respaldo. Es una capacidad necesaria para la operación, aunque no bloquea la gestión básica de personal y permisos.

**Prueba Independiente**: Una jefatura puede registrar la entrada y salida de un colaborador, ver las horas calculadas y consultar el resumen del período; un registro duplicado o inválido se rechaza.

**Escenarios de Aceptación**:

1. **Dado** un colaborador activo y una fecha laboral, **cuando** se registran la hora de entrada y la hora de salida, **entonces** el sistema calcula las horas trabajadas y guarda el registro.
2. **Dado** un registro existente para el mismo colaborador y fecha, **cuando** se intenta crear otro, **entonces** el sistema lo impide y explica que la jornada ya está registrada.
3. **Dado** un registro con hora de salida anterior o igual a la hora de entrada, **cuando** se guarda, **entonces** el sistema lo rechaza con una explicación clara.
4. **Dados** los registros de un período, **cuando** la jefatura consulta por área, **entonces** ve las horas trabajadas, las ausencias y un resumen de ausentismo.
5. **Dado** un colaborador desvinculado, **cuando** se intenta registrar asistencia, **entonces** el sistema lo impide y conserva el historial existente.
6. **Dado** un registro con fecha laboral futura, **cuando** se intenta guardar, **entonces** el sistema lo rechaza con una explicación clara.

---

### Historia de Usuario 7 - Ejecutar y consultar la liquidación de nómina (Prioridad: P1)

Como encargado de nómina, quiero calcular y consultar las liquidaciones de un período para pagar correctamente haberes y deducciones y entregar la papeleta al colaborador.

**Por qué esta prioridad**: La liquidación es el resultado central del módulo: concentra contrato, conceptos y período, y debe ser trazable, consistente y visible solo para quienes corresponda.

**Prueba Independiente**: Un encargado de nómina selecciona un período y un colaborador con contrato vigente, ejecuta la liquidación, revisa el desglose de haberes y deducciones, y el colaborador ve su propia papeleta.

**Escenarios de Aceptación**:

1. **Dado** un período en estado borrador y un colaborador con un contrato que se superpone al menos un día con el período, **cuando** se ejecuta la liquidación, **entonces** el sistema calcula el total de haberes, las deducciones y el sueldo líquido, y guarda la liquidación con sus detalles.
2. **Dados** los conceptos de nómina clasificados como haber o deducción, **cuando** se consulta la liquidación, **entonces** se muestra el desglose por concepto y se cumple que el sueldo líquido es igual al total de haberes menos las deducciones.
3. **Dado** un período ya calculado, **cuando** se intenta generar una segunda liquidación para el mismo colaborador, **entonces** el sistema la impide y explica que ya existe.
4. **Dado** un período cerrado, **cuando** se intenta modificar una liquidación, **entonces** el sistema lo impide; solo un usuario autorizado puede reabrirlo dejando registro de auditoría.
5. **Dado** un colaborador autenticado, **cuando** consulta sus liquidaciones, **entonces** solo ve las propias y puede descargar su papeleta.
6. **Dado** un colaborador sin contrato vigente en el período, **cuando** se intenta liquidar, **entonces** el sistema lo rechaza con una explicación clara.
7. **Dado** un período sin liquidaciones, **cuando** se ejecuta la corrida, **entonces** el sistema informa que no hay colaboradores elegibles y no genera registros vacíos.
8. **Dado** un contrato que cubre solo parte del período, **cuando** se liquida, **entonces** el sueldo base se prorratea por los días de superposición entre contrato y período.

---

### Historia de Usuario 8 - Control de acceso basado en roles (Prioridad: P1)

Como administrador de RRHH, quiero asignar roles y limitar las acciones y los datos a los que accede cada usuario para proteger la información sensible y asegurar que cada persona realice solo las tareas que le corresponden.

**Por qué esta prioridad**: El módulo maneja datos personales, salariales y de salud; el acceso debe restringirse por rol antes de usarlo con datos reales. La confidencialidad salarial y la separación entre jefatura, nómina y administración son requisitos del negocio.

**Prueba Independiente**: El administrador asigna roles a cuatro usuarios; cada uno inicia sesión y solo ve las pantallas y datos permitidos; un intento de acceso directo por URL a otra área se bloquea con un mensaje claro.

**Escenarios de Aceptación**:

1. **Dado** un usuario con rol Administrador de RRHH, **cuando** inicia sesión, **entonces** puede gestionar departamentos, cargos, colaboradores y contratos, con control total sobre las fichas de personal.
2. **Dado** un usuario con rol Encargado de Nómina, **cuando** inicia sesión, **entonces** puede administrar períodos, conceptos y liquidaciones y registrar o consultar asistencia, pero no puede modificar fichas de personal ni acceder a datos médicos.
3. **Dado** un usuario con rol Jefatura o Supervisor, **cuando** inicia sesión, **entonces** solo puede ver y visar permisos y asistencia de sus subordinados directos, sin visibilidad del salario base.
4. **Dado** un usuario con rol Empleado, **cuando** inicia sesión, **entonces** solo ve sus propias papeletas y solicitudes, y no puede acceder a registros de otros colaboradores.
5. **Dado** un usuario autenticado, **cuando** intenta acceder a una pantalla o acción fuera de sus permisos por navegación o por URL directa, **entonces** el sistema bloquea la operación, muestra un mensaje claro y no expone datos sensibles.
6. **Dado** un usuario sin rol asignado, **cuando** intenta acceder al módulo, **entonces** el sistema le deniega el acceso hasta que un administrador le asigne un rol.
7. **Dado** un cambio de rol realizado por un administrador, **cuando** el usuario afectado vuelve a iniciar sesión, **entonces** los nuevos permisos se aplican correctamente.

---

### Historia de Usuario 9 - Validación de Asistencia y Aprobación de Horas Extras (Prioridad: P2)

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

Como jefatura, quiero registrar evaluaciones periódicas de desempeño de mis colaboradores directos para dejar evidencia objetiva de su rendimiento y acordar mejoras.

**Por qué esta prioridad**: Las evaluaciones permiten comparar desempeño con metas acordadas y reducen la subjetividad; complementan la gestión de personal sin bloquear el MVP.

**Prueba Independiente**: Una jefatura registra una evaluación para un subordinado directo con una calificación entre 1.00 y 5.00 y comentarios; el colaborador la ve en su ficha y una evaluación fuera de rango se rechaza.

**Escenarios de Aceptación**:

1. **Dado** un supervisor con subordinados directos, **cuando** registra una evaluación con fecha, calificación y comentarios, **entonces** la evaluación se guarda y queda asociada al colaborador y al evaluador.
2. **Dado** un colaborador autenticado, **cuando** consulta sus evaluaciones, **entonces** solo ve las propias.
3. **Dado** un valor de calificación menor que 1.00 o mayor que 5.00, **cuando** se intenta guardar, **entonces** el sistema lo rechaza con un mensaje claro.
4. **Dado** un colaborador que no es subordinado directo del evaluador, **cuando** se intenta evaluar, **entonces** el sistema lo impide.

---

### Casos Límite (resueltos)

- **Código o nombre de departamento duplicado:** se bloquea el guardado; ambos campos son obligatorios y únicos (FR-002).
- **Eliminar un cargo con empleados o contrato vigente:** se bloquea con un mensaje que indica las dependencias (FR-005).
- **Empleado sin supervisor:** se permite `supervisor_id = null` solo para niveles sin jefatura; no habilita aprobaciones automáticas (FR-008).
- **Auto-supervisión o ciclo de supervisión:** se bloquea la asignación (FR-008).
- **Contrato sin fecha de término:** `Indefinido` y `Honorarios` permiten fecha nula; `Plazo fijo` exige `fecha_fin` (FR-013).
- **Contratos superpuestos:** se bloquea cualquier superposición de fechas para el mismo empleado (FR-014).
- **Solicitud de permiso sin saldo:** se bloquea si los días solicitados superan `dias_vacaciones_disponibles`; aplica a tipos de vacaciones (FR-019).
- **Solicitudes superpuestas:** se bloquea si existe otra solicitud pendiente o aprobada en fechas superpuestas (FR-019).
- **Asistencia en fecha futura:** se rechaza (FR-024).
- **Hora de salida anterior o igual a la de entrada:** se rechaza con mensaje claro (FR-024).
- **Nómina sin colaboradores elegibles:** se informa y no se generan liquidaciones vacías (FR-030, HU7 esc. 7).
- **Reapertura de un período cerrado:** solo un administrador puede reabrirlo a `Aprobado` con auditoría; el recálculo actualiza las liquidaciones existentes sin duplicarlas (FR-034).
- **Usuario sin rol o acceso directo por URL:** se deniega el acceso y no se exponen datos (FR-045, FR-046).
- **Jefatura intenta ver sueldo base o datos bancarios:** la interfaz y la capa de datos ocultan esos campos (FR-027).
- **Eliminar un empleado con liquidaciones, evaluaciones o contratos históricos:** se bloquea; solo se eliminan en cascada asistencia, solicitudes y beneficios sin historial de nómina (FR-054).
- **Inscripción duplicada en un beneficio activo:** se bloquea y se muestra la inscripción existente (FR-039).
- **Evaluar a un colaborador que no es subordinado directo:** se bloquea (FR-042).
- **`localStorage` corrupto o incompleto:** se informa, se conserva lo recuperable y se ofrece restablecer los datos semilla (FR-051).

## Requisitos *(obligatorio)*

### Requisitos Funcionales

#### Organización y personal

- **FR-001**: El sistema DEBE permitir crear, editar y eliminar departamentos con nombre, código, empresa y jefe de departamento.
- **FR-002**: El sistema DEBE validar que el nombre y el código del departamento sean obligatorios y únicos.
- **FR-003**: El sistema DEBE impedir eliminar un departamento con empleados o cargos asociados y ofrecer reasignarlos a otro departamento.
- **FR-004**: El sistema DEBE permitir crear, editar y eliminar cargos con nombre, nivel jerárquico (grado) y departamento.
- **FR-005**: El sistema DEBE impedir eliminar un cargo asignado a empleados o referenciado por contratos vigentes.
- **FR-006**: El sistema DEBE permitir registrar y editar empleados con RUT único, nombres, apellidos, correo, teléfono, dirección, fecha de nacimiento, fecha de contratación, estado laboral, departamento, cargo y supervisor.
- **FR-007**: El sistema DEBE validar los campos obligatorios del empleado, el formato y la unicidad del correo, la unicidad del RUT, la coherencia de fechas, que el cargo pertenezca al departamento y que el supervisor pertenezca a la misma organización.
- **FR-008**: El sistema DEBE impedir que un empleado sea su propio supervisor o que se generen ciclos de supervisión; `supervisor_id` puede ser nulo para niveles sin jefatura.
- **FR-009**: El sistema DEBE permitir al empleado actualizar su correo electrónico, teléfono y dirección, validando la unicidad del correo y reflejando los cambios en su ficha y en la vista de RRHH.
- **FR-010**: El sistema DEBE exigir validación de RRHH para cambios de datos bancarios, registrar la solicitud con estado, certificado adjunto y auditoría, y bloquear una segunda solicitud mientras exista una pendiente.
- **FR-011**: El sistema DEBE impedir que el empleado modifique por autoservicio su sueldo base, su cargo o su rol.

#### Contratos

- **FR-012**: El sistema DEBE permitir registrar contratos con empleado, tipo de contrato (`Indefinido`, `Plazo fijo`, `Honorarios`), fecha de inicio, fecha de término, salario base y moneda (`CLP`, `USD`, `UF`).
- **FR-013**: El sistema DEBE validar que la fecha de término sea igual o posterior a la fecha de inicio, que el salario sea mayor que cero, que la moneda esté entre `CLP`, `USD` y `UF` y que los contratos `Plazo fijo` tengan fecha de término.
- **FR-014**: El sistema DEBE impedir cualquier superposición de fechas entre contratos del mismo empleado.
- **FR-015**: El sistema DEBE generar un contrato editable usando la plantilla predefinida del módulo, parametrizada por cargo y tipo de contrato, con los datos precargados del colaborador.
- **FR-016**: El sistema DEBE conservar el historial de contratos finalizados sin eliminarlos.

#### Permisos y asistencia

- **FR-017**: El sistema DEBE administrar los tipos de permiso con nombre y marca de si son remunerados.
- **FR-018**: El sistema DEBE permitir registrar solicitudes de permiso con empleado, tipo, fechas, estado, aprobador y fecha de resolución.
- **FR-019**: El sistema DEBE validar fechas, superposición de solicitudes, saldo disponible y dotación mínima del área. La dotación mínima del MVP es 1: una aprobación se bloquea si dejaría al departamento sin ningún empleado activo disponible en esas fechas.
- **FR-020**: El sistema DEBE permitir a la jefatura aprobar o rechazar solicitudes, exigiendo comentario al rechazar y notificar al empleado mediante un aviso en la interfaz.
- **FR-021**: El sistema DEBE actualizar el saldo del empleado y el calendario derivado de solicitudes aprobadas cuando una solicitud es aprobada.
- **FR-022**: El sistema DEBE registrar la asistencia diaria con empleado, fecha laboral, hora de entrada, hora de salida y horas trabajadas calculadas.
- **FR-023**: El sistema DEBE impedir más de un registro de asistencia por empleado y fecha.
- **FR-024**: El sistema DEBE rechazar registros con hora de salida anterior o igual a la hora de entrada, fechas futuras y registros de empleados desvinculados.
- **FR-025**: El sistema DEBE entregar un resumen de horas trabajadas, ausencias y ausentismo por área y período. El ausentismo se calcula como días de ausencia aprobados en el período dividido por (empleados activos × días del período), expresado en porcentaje.
- **FR-026**: El sistema DEBE permitir a la jefatura validar asistencia y horas extras solo de sus subordinados directos.
- **FR-027**: El sistema DEBE ocultar a la jefatura los datos salariales, bancarios y médicos de los colaboradores.

#### Nómina

- **FR-028**: El sistema DEBE administrar períodos de nómina con fecha de inicio, fecha de término, fecha de ejecución y estado.
- **FR-029**: El sistema DEBE administrar conceptos de nómina clasificados como haber o deducción.
- **FR-030**: El sistema DEBE calcular el total de haberes, el total de deducciones y el sueldo líquido de cada colaborador elegible. Un colaborador es elegible si tiene al menos un contrato que se superpone un día o más con el período; el sueldo base se prorratea por los días cubiertos.
- **FR-031**: El sistema DEBE guardar el detalle de la liquidación por concepto y cumplir que `sueldo_liquido = total_haberes - deducciones`.
- **FR-032**: El sistema DEBE impedir más de una liquidación por colaborador y período; un recálculo actualiza la liquidación existente.
- **FR-033**: El sistema DEBE rechazar la liquidación de colaboradores sin contrato que se superponga con el período.
- **FR-034**: El sistema DEBE impedir modificar liquidaciones de un período cerrado; solo un administrador puede reabrirlo a estado `Aprobado` dejando auditoría, y el recálculo posterior actualiza las liquidaciones sin duplicarlas.
- **FR-035**: El sistema DEBE permitir al colaborador consultar y descargar solo sus propias papeletas de pago.
- **FR-036**: El sistema DEBE consolidar el costo de nómina por período y por departamento como la suma de `sueldo_liquido` de las liquidaciones; el costo total de personal suma además el costo de beneficios.

#### Beneficios y desempeño

- **FR-037**: El sistema DEBE administrar el catálogo de beneficios con nombre, proveedor y costo.
- **FR-038**: El sistema DEBE permitir inscribir colaboradores en beneficios con fecha de inscripción y conservar el historial.
- **FR-039**: El sistema DEBE impedir inscripciones duplicadas o activas simultáneas del mismo colaborador en el mismo beneficio.
- **FR-040**: El sistema DEBE impedir eliminar un beneficio con inscripciones activas.
- **FR-041**: El sistema DEBE registrar evaluaciones de desempeño con colaborador, evaluador, fecha, calificación decimal entre 1.00 y 5.00, comentarios y objetivos acordados.
- **FR-042**: El sistema DEBE permitir evaluar solo a subordinados directos y mostrar al colaborador solo sus propias evaluaciones.
- **FR-043**: El sistema DEBE consolidar el costo de beneficios por colaborador y por período, prorrateando el costo mensual por los días de inscripción activa dentro del período.

#### Seguridad, datos y plataforma

- **FR-044**: El sistema DEBE implementar los roles Administrador de RRHH, Encargado de Nómina, Jefatura/Supervisor y Empleado.
- **FR-045**: El sistema DEBE restringir pantallas, acciones y datos según el rol, incluso ante acceso directo por URL.
- **FR-046**: El sistema DEBE denegar el acceso a usuarios sin rol asignado.
- **FR-047**: El sistema DEBE aplicar los cambios de rol en el siguiente inicio de sesión del usuario afectado.
- **FR-048**: El sistema DEBE registrar auditoría de cambios de salario, datos bancarios, roles y reapertura de períodos con usuario, acción, entidad, identificador, detalle y fecha; conserva los últimos 500 eventos.
- **FR-049**: El sistema DEBE sanitizar los datos ingresados por el usuario antes de renderizarlos para prevenir XSS.
- **FR-050**: El sistema DEBE registrar tipos y días de ausencia médica sin almacenar diagnósticos clínicos.
- **FR-051**: El sistema DEBE persistir las 14 entidades oficiales más las colecciones de soporte `USUARIOS` y `AUDITORIA` en `localStorage`, cargar datos semilla y recuperarse de datos corruptos ofreciendo restablecer la semilla.
- **FR-052**: El sistema DEBE ofrecer búsqueda y filtros por nombre, código, área, cargo, estado y período sobre departamentos, cargos, empleados, contratos, permisos, asistencia, nómina, beneficios y evaluaciones.
- **FR-053**: El sistema DEBE mostrar indicadores de dotación activa, distribución por departamento, ausentismo y costo de nómina.
- **FR-054**: El sistema DEBE mantener la integridad referencial al crear, editar y eliminar registros con esta política: se bloquea el borrado con dependencias históricas (contratos, liquidaciones, evaluaciones, personas a cargo); se elimina en cascada la asistencia, solicitudes de permiso e inscripciones de beneficios de un empleado eliminable.
- **FR-055**: El sistema DEBE ser usable con al menos 500 empleados y 500 registros de asistencia; la suite de rendimiento debe completarse en menos de 10 segundos y mantener búsquedas y panel consistentes.
- **FR-056**: El sistema DEBE ser responsivo y accesible conforme a WCAG 2.1 AA en viewports de 360 px, 768 px y 1280 px, con etiquetas, foco de teclado, contraste y mensajes de error claros.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **DEPARTAMENTOS**: área organizacional con nombre, código único, empresa y jefe; agrupa empleados y cargos.
- **CARGOS**: puesto de trabajo con nombre, nivel jerárquico (grado) y departamento; se asigna a empleados y contratos.
- **EMPLEADOS**: ficha laboral con RUT único, identificación, contacto, fecha de contratación, estado, departamento, cargo y supervisor.
- **CONTRATOS_EMPLEADO**: vínculo contractual con tipo, vigencia, salario base y moneda.
- **BENEFICIOS**: catálogo de beneficios con proveedor, costo y estado.
- **BENEFICIOS_EMPLEADO**: inscripción de un empleado en un beneficio, con fecha de inscripción, fecha de fin y estado.
- **REGISTROS_ASISTENCIA**: marcación diaria con entrada, salida, horas trabajadas, horas extras y estado de validación.
- **TIPOS_PERMISO**: catálogo de ausencias con marca de remuneración y días anuales.
- **SOLICITUDES_PERMISO**: solicitud de ausencia con fechas, días, estado, aprobador y comentario de resolución.
- **PERIODOS_NOMINA**: período mensual de cálculo con fechas, fecha de ejecución y estado.
- **CONCEPTOS_NOMINA**: concepto de haber o deducción aplicable a una liquidación, con porcentaje o monto fijo.
- **LIQUIDACIONES**: resultado de nómina por empleado y período con total de haberes, deducciones y sueldo líquido.
- **DETALLES_LIQUIDACION**: línea de una liquidación con concepto y monto.
- **EVALUACIONES_DESEMPENO**: evaluación periódica con evaluador, fecha, calificación decimal, comentarios y objetivos.

**Entidades de soporte (fuera del MER oficial de 14):**

- **USUARIOS**: cuenta de demostración con correo, nombre, rol (`admin`, `payroll`, `supervisor`, `employee`) y vínculo opcional a `EMPLEADOS`; los cambios de rol se guardan como overrides.
- **AUDITORIA**: evento trazable con usuario, acción, entidad, identificador, detalle y fecha.

Las relaciones, claves primarias y foráneas se detallan en `data-model.md` y en el diagrama `modelo-entidadrelacion.png`.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Un administrador puede crear un empleado con su contrato en menos de 3 minutos.
- **SC-002**: El cálculo de nómina de 50 colaboradores se completa en menos de 5 segundos, verificado por una prueba automatizada.
- **SC-003**: Al menos el 90% de los usuarios de prueba completan las tareas principales sin ayuda en la validación de demo.
- **SC-004**: El sistema sigue siendo usable con 500 empleados y 500 registros de asistencia; la suite de rendimiento se completa en menos de 10 segundos.
- **SC-005**: El 100% de los intentos de acceso fuera de rol se bloquean sin exponer datos sensibles.
- **SC-006**: El 100% de las liquidaciones cumple `sueldo_liquido = total_haberes - deducciones`.
- **SC-007**: El 100% de los registros de asistencia duplicados o inválidos se rechazan.
- **SC-008**: Una aprobación de permiso actualiza el estado y el saldo del empleado en menos de 2 segundos, verificado por una prueba automatizada.
- **SC-009**: Los indicadores del panel coinciden con los datos almacenados en el 100% de las verificaciones automatizadas.
- **SC-010**: La documentación de `spec.md`, `plan.md`, `data-model.md` y `tasks.md` no contiene referencias rotas ni historias sin tareas asociadas; un script de verificación lo comprueba.
- **SC-011**: El flujo E2E crítico (login → RBAC → solicitud de permiso → aprobación → nómina → papeleta) pasa al 100% en cada build.

## Suposiciones

- El módulo se ejecuta en un único espacio de trabajo y no requiere multiempresa real; `empresa_id` se usa como dato de contexto.
- La persistencia es local (`localStorage`); los datos semilla representan las 14 entidades oficiales y las colecciones de soporte `USUARIOS` y `AUDITORIA`.
- No hay backend ni autenticación real: los usuarios y roles se simulan con datos de demo y los cambios de rol se guardan como overrides.
- El salario base y los datos bancarios son datos sensibles y solo se muestran a roles autorizados.
- Las ausencias médicas se registran por tipo y días, sin diagnósticos ni información clínica.
- La moneda principal es CLP; el modelo admite `CLP`, `USD` y `UF`.
- Las horas extras se calculan a partir de las horas trabajadas registradas y aprobadas por la jefatura; la jornada base es de 9 horas y el factor de hora extra es 1,5.
- La nómina del MVP es una simulación: no incluye integración contable real ni pago efectivo.
- La plantilla de contrato es única y está parametrizada por cargo y tipo de contrato; se genera como texto editable en el navegador, sin firma electrónica.
- La dotación mínima del MVP es fija: al menos un empleado activo debe permanecer disponible en el departamento.
- Las notificaciones al empleado son avisos en la interfaz (toast) y no se persisten como bandeja.
- La auditoría conserva los últimos 500 eventos en `hr.auditoria`.
- La interfaz reutiliza el marco y los componentes del módulo base (`001`) sin modificarlos.
- Los datos de demo se pueden restablecer desde la aplicación para repetir la presentación.
- El navegador objetivo es una versión moderna de Chrome, Edge o Firefox.
