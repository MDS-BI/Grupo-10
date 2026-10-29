# Especificación de la Funcionalidad: Módulo de Recursos Humanos y Planilla (HR / Payroll)

**Rama de la funcionalidad**: 002-rrhh-planilla  
**Creada**: 2026-07-08  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Gestionar la información del personal y la administración de recursos humanos: fichas laborales, contratos, permisos, asistencia, beneficios, evaluaciones y nóminas de pago, sobre el modelo relacional oficial del ERP."

## Propósito

Este proyecto implementa el módulo de Recursos Humanos y Planilla (HR / Payroll) sobre el módulo base de ERP. Reutiliza los patrones de datos maestros, documentos, navegación, validación, persistencia y búsqueda del ERP base, y los extiende con las 14 tablas del módulo HR/Payroll definidas en `erp_data_model.md`: estructura organizacional, personal, contratos, permisos, asistencia, nómina, beneficios y desempeño.

El objetivo del MVP es centralizar las fichas laborales, formalizar contratos, gestionar permisos de forma trazable, registrar asistencia y simular la liquidación mensual, con control de acceso por roles y protección de datos sensibles. La arquitectura de datos y las claves foráneas oficiales se detallan en `erp_data_model.md` (sección 1); `data-model.md` es la vista de negocio en español del mismo módulo. El alcance y los roles se detallan en `plan.md`.

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

- ¿Qué ocurre cuando un usuario intenta guardar una entidad sin nombre o código obligatorio?
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar una entidad que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida?
- ¿Qué ocurre con los documentos de una entidad cuando esta se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en un documento?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración?
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en la pantalla de gestión o búsqueda (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en la pantalla de gestión o búsqueda?
- ¿Qué ocurre si un usuario navega fuera de la pantalla de gestión mientras un formulario aún tiene cambios sin guardar?
- ¿Permanecen intactas las entidades y los documentos al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero entidades o cero documentos (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por nombre, código, categoría u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar una lista clara de entidades e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Entidades, Documentos y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Entidades DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El botón de módulo Documentos DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar entidades por nombre, código, categoría, descripción o fecha objetivo.
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de entidades y documentos intactos y consistentes durante la navegación entre pantallas.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología Entidad/Documento, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros de entidad.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nueva entidad, nuevo documento, abrir gestión de entidades y buscar registros.
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de entidades y documentos almacenados, actualizadas cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional y un entity_id autogenerado. Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte data-model.md para su forma completa.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
