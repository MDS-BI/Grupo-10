# Contrato de Almacenamiento del Módulo de RRHH

## Propósito

El módulo de RRHH persiste las 14 entidades oficiales y las colecciones de soporte `USUARIOS` y `AUDITORIA` en `localStorage`. Este contrato define las claves, la forma de los datos y las operaciones que deben respetar la interfaz y las pruebas.

## Claves de almacenamiento

| Clave | Entidad | Tipo |
|---|---|---|
| `hr.departamentos` | DEPARTAMENTOS | Array |
| `hr.cargos` | CARGOS | Array |
| `hr.empleados` | EMPLEADOS | Array |
| `hr.contratosEmpleado` | CONTRATOS_EMPLEADO | Array |
| `hr.beneficios` | BENEFICIOS | Array |
| `hr.beneficiosEmpleado` | BENEFICIOS_EMPLEADO | Array |
| `hr.registrosAsistencia` | REGISTROS_ASISTENCIA | Array |
| `hr.tiposPermiso` | TIPOS_PERMISO | Array |
| `hr.solicitudesPermiso` | SOLICITUDES_PERMISO | Array |
| `hr.periodosNomina` | PERIODOS_NOMINA | Array |
| `hr.conceptosNomina` | CONCEPTOS_NOMINA | Array |
| `hr.liquidaciones` | LIQUIDACIONES | Array |
| `hr.detallesLiquidacion` | DETALLES_LIQUIDACION | Array |
| `hr.evaluaciones` | EVALUACIONES_DESEMPENO | Array |
| `hr.auditoria` | AUDITORIA (soporte) | Array |
| `hr.rolesUsuarios` | Overrides de rol de USUARIOS (soporte) | Objeto |
| `hr.sesion` | Sesión activa de demo | Objeto |
| `hr.seed.version` | Versión de datos semilla | Texto |

## Operaciones

- `loadCollection(name)` / `saveCollection(name, items)`: leen y persisten una colección completa con validación de `JSON`.
- `nextId(collection)`: calcula el siguiente identificador de la colección.
- `seedAll()` / `resetStorage()`: cargan o restauran los datos semilla de las 14 entidades.
- `loadAudit()` / `logAudit(entry)` / `clearAudit()`: gestionan la colección de auditoría.
- `getSession()` / `saveSession(session)` / `logout()`: gestionan la sesión de demo.
- `getDemoUsers()` / `updateUserRole(usuarioId, rol)` / `resetUserRoles()`: gestionan las cuentas y los overrides de rol.
- `runPayroll(periodId)` / `getPayrollCostSummary(periodId)`: ejecutan y consolidan la nómina.

## Reglas de integridad

- Los identificadores son únicos por entidad.
- Las referencias foráneas deben apuntar a registros existentes.
- La eliminación de un registro con dependencias se bloquea o se resuelve en cascada según la regla de negocio documentada en `data-model.md`.
- Los registros históricos (contratos finalizados, liquidaciones cerradas y evaluaciones) no se eliminan.
- La eliminación de un empleado se bloquea si tiene contratos, liquidaciones, evaluaciones o personas a cargo; en caso contrario se eliminan en cascada asistencia, solicitudes de permiso e inscripciones de beneficios.
- Las acciones sensibles generan una entrada en `hr.auditoria` con usuario, acción, entidad, identificador, fecha y detalle; se conservan los últimos 500 eventos.
- Un período `Cerrado` solo se reabre a `Aprobado` por un administrador y el recálculo actualiza las liquidaciones existentes.

## Forma de los datos

Cada entidad respeta los atributos definidos en `data-model.md`:

- Claves primarias: `departamento_id`, `cargo_id`, `empleado_id`, `contrato_id`, `beneficio_id`, `beneficio_empleado_id`, `asistencia_id`, `tipo_permiso_id`, `solicitud_permiso_id`, `periodo_nomina_id`, `concepto_id`, `liquidacion_id`, `detalle_liquidacion_id`, `evaluacion_id`.
- Claves foráneas: según el diagrama ER y la sección 5 de `data-model.md`.
- Fechas en formato ISO `YYYY-MM-DD`; marcas de tiempo en ISO 8601.
- Montos como números; la interfaz los formatea como CLP.
- `EMPLEADOS` incluye los atributos extendidos `rut`, `telefono`, `direccion`, `datos_bancarios`, `solicitud_bancaria`, `documentos_legales` y `dias_vacaciones_disponibles`.
- `TIPOS_PERMISO` incluye `dias_anuales`; `SOLICITUDES_PERMISO` incluye `fecha_solicitud`, `dias_solicitados` y `comentario_aprobacion`.
- `DEPARTAMENTOS` incluye `codigo_departamento`.
- `CONTRATOS_EMPLEADO` incluye `texto_contrato`.
- `BENEFICIOS_EMPLEADO` incluye `fecha_fin` y `estado`.
- `REGISTROS_ASISTENCIA` incluye `horas_extras`, `estado_validacion` y `validado_por`.
- `CONCEPTOS_NOMINA` incluye `porcentaje` y `monto_fijo`.
- `LIQUIDACIONES` incluye `total_deducciones`.

## Expectativas de validación

- No se persiste un registro con campos obligatorios vacíos; `EMPLEADOS.rut` es obligatorio y único.
- No se persiste una referencia foránea inexistente.
- No se permite un contrato vigente superpuesto ni una liquidación duplicada por empleado/período.
- No se permite una inscripción activa duplicada en el mismo beneficio.
- No se permite una evaluación fuera del rango 1.00–5.00.
- No se permite un saldo de vacaciones negativo ni una solicitud con `dias_solicitados` superior al saldo disponible.
- Un cambio bancario no se aplica hasta que `solicitud_bancaria.estado` sea `aprobada`.
- Los datos de `localStorage` corruptos se informan y se ofrece restablecer los datos semilla.

## Expectativas de privacidad

- La capa de almacenamiento guarda los datos completos; la capa de presentación filtra los campos según el rol.
- Los datos salariales, bancarios y de salud nunca se incluyen en vistas de roles no autorizados.
- Los registros de auditoría no se muestran a roles sin permiso de administración.
