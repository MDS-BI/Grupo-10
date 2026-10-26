Historia de Usuario 1 - Actualización de datos personales y de contacto (Prioridad: P1)
Como empleado, quiero actualizar mis datos personales, de contacto y bancarios para que la empresa pueda comunicarse conmigo correctamente y emitir mis pagos sin errores.

Por qué esta prioridad: Mantener la información de los colaboradores al día previene problemas administrativos, de nómina y asegura una comunicación fluida y legalmente válida.

Prueba Independiente: Un empleado puede modificar su dirección o información de contacto en su perfil, y los cambios se reflejan inmediatamente tanto en su vista como en el registro accesible para RRHH.

Escenarios de Aceptación:

Dada la ficha del perfil del empleado, cuando el usuario modifica su número de teléfono o dirección, entonces la nueva información se guarda de forma segura y se muestra actualizada en pantalla.

Dado que el empleado necesita cambiar su cuenta bancaria para el depósito de su sueldo, cuando ingresa los nuevos datos y adjunta el certificado del banco, entonces la solicitud queda pendiente de validación y se notifica al administrador de RRHH.

---

Historia de Usuario 2 - Gestión de altas y contratos de nuevos colaboradores (Prioridad: P1)
Como administrador de RRHH, quiero registrar un nuevo colaborador y generar su contrato de trabajo para mantener formalizada su incorporación a la empresa.

Por qué esta prioridad: Un proceso de alta ágil y estructurado asegura el cumplimiento legal laboral, la correcta integración a la nómina y el acceso oportuno del colaborador a los sistemas internos.

Prueba Independiente: Un administrador de RRHH puede ingresar los datos de un nuevo empleado, adjuntar los documentos legales requeridos y generar el contrato basado en una plantilla predefinida.

Escenarios de Aceptación:

Dado el formulario de ingreso de personal, cuando el administrador completa los datos obligatorios (RUT, cargo, sueldo, fecha de inicio) y sube los documentos requeridos, entonces el perfil del empleado se crea exitosamente en el sistema.

Dada la creación del perfil, cuando el administrador selecciona la plantilla del contrato correspondiente al cargo, entonces el sistema genera un documento editable y con los datos precargados del colaborador

---

Historia de Usuario 3 - Aprobación de solicitudes de vacaciones y permisos (Prioridad: P1)
Como jefatura o supervisor, quiero revisar y aprobar o rechazar las solicitudes de vacaciones y permisos de mi equipo para asegurar la continuidad operacional del área.

Por qué esta prioridad: Gestionar las ausencias de manera oportuna evita cuellos de botella en la operación diaria y mantiene una planificación transparente y justa del personal a cargo.

Prueba Independiente: Una jefatura puede visualizar las solicitudes pendientes de su equipo, verificar los días disponibles en el saldo y aprobarlas o rechazarlas con un comentario opcional.

Escenarios de Aceptación:

Dada una solicitud de vacaciones enviada por un miembro del equipo, cuando el supervisor revisa las fechas y el saldo de días disponibles, entonces puede hacer clic en "Aprobar" y el sistema actualiza el calendario y el saldo del empleado.

Dada una solicitud que genera un conflicto de dotación mínima en el área, cuando el supervisor la rechaza indicando un motivo, entonces la solicitud cambia de estado y se notifica al empleado con el comentario ingresado.
