# Contrato de Almacenamiento del Módulo de RRHH

## Propósito

El módulo de RRHH persiste las 14 entidades en `localStorage`. Este contrato define las claves, la forma de los datos y las operaciones que deben respetar la interfaz y las pruebas.

## Claves de almacenamiento

| Clave | Entidad | Tipo |
|---|---|---|
| `hr.departamentos` | DEPARTAMENTOS | Array |
| `hr.cargos` | CARGOS | Array |
| `hr.empleados` | EMPLEADOS | Array |
| `hr.contratos` | CONTRATOS_EMPLEADO | Array |
| `hr.beneficios` | BENEFICIOS | Array |
| `hr.beneficiosEmpleado` | BENEFICIOS_EMPLEADO | Array |
| `hr.asistencia` | REGISTROS_ASISTENCIA | Array |
| `hr.tiposPermiso` | TIPOS_PERMISO | Array |
| `hr.solicitudesPermiso` | SOLICITUDES_PERMISO | Array |
| `hr.periodosNomina` | PERIODOS_NOMINA | Array |
| `hr.conceptosNomina` | CONCEPTOS_NOMINA | Array |
| `hr.liquidaciones` | LIQUIDACIONES | Array |
| `hr.detallesLiquidacion` | DETALLES_LIQUIDACION | Array |
| `hr.evaluaciones` | EVALUACIONES_DESEMPENO | Array |
| `hr.auditoria` | Registro de auditoría | Array |
| `hr.sesion` | Sesión activa de demo | Objeto |

## Operaciones

- `loadCollection(key)`: devuelve el arreglo almacenado o un arreglo vacío.
- `saveCollection(key, items)`: persiste el arreglo completo.
- `addItem(key, item)`: agrega un registro con identidad y marcas de tiempo.
- `updateItem(key, id, changes)`: actualiza un registro existente.
- `deleteItem(key, id)`: elimina un registro por identificador.
- `resetSeed()`: restaura los datos semilla de las 14 entidades.
- `loadSession()` / `saveSession(session)` / `clearSession()`: gestionan la sesión de demo.

## Reglas de integridad

- Los identificadores son únicos por entidad.
- Las referencias foráneas deben apuntar a registros existentes.
- La eliminación de un registro con dependencias se bloquea o se resuelve en cascada según la regla de negocio documentada en `data-model.md`.
- Los registros históricos (contratos finalizados, liquidaciones cerradas y evaluaciones) no se eliminan.
- Toda operación de escritura actualiza `updatedAt` cuando el registro lo posee.
- Las acciones sensibles generan una entrada en `hr.auditoria` con usuario, acción, entidad, fecha y detalle.

## Forma de los datos

Cada entidad respeta los atributos definidos en `data-model.md`:

- Claves primarias: `departamento_id`, `cargo_id`, `empleado_id`, `contrato_id`, `beneficio_id`, `beneficio_empleado_id`, `asistencia_id`, `tipo_permiso_id`, `solicitud_permiso_id`, `periodo_nomina_id`, `concepto_id`, `liquidacion_id`, `detalle_liquidacion_id`, `evaluacion_id`.
- Claves foráneas: según el diagrama ER y la sección 5 de `data-model.md`.
- Fechas en formato ISO `YYYY-MM-DD`; marcas de tiempo en ISO 8601.
- Montos como números; la interfaz los formatea como CLP.

## Expectativas de validación

- No se persiste un registro con campos obligatorios vacíos.
- No se persiste una referencia foránea inexistente.
- No se permite un contrato vigente superpuesto ni una liquidación duplicada por empleado/período.
- No se permite una inscripción activa duplicada en el mismo beneficio.
- No se permite una evaluación fuera del rango 1.00–5.00.
- Los datos de `localStorage` corruptos se informan y se ofrece restablecer los datos semilla.

## Expectativas de privacidad

- La capa de almacenamiento guarda los datos completos; la capa de presentación filtra los campos según el rol.
- Los datos salariales, bancarios y de salud nunca se incluyen en vistas de roles no autorizados.
- Los registros de auditoría no se muestran a roles sin permiso de administración.
