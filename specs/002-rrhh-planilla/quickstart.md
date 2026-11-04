# Inicio Rápido: Módulo de Recursos Humanos y Planilla (HR / Payroll)

## Estado

El módulo está **implementado y demostrable**. La suite automatizada cubre las 11 historias de usuario y el build de producción se genera correctamente.

## Configuración

1. Instalar las dependencias con `npm install`.
2. Iniciar el servidor de desarrollo con `npm run dev`.
3. Abrir la URL local que entrega Vite en el navegador.
4. Ejecutar las pruebas con `npm test`.
5. Generar el build con `npm run build` y servirlo con `npm run preview`.

## Datos de demostración

- Los datos semilla se cargan desde `src/data/seed.js` y cubren las 14 entidades oficiales más las colecciones de soporte `USUARIOS` y `AUDITORIA`.
- Para reiniciar la demo, borra las claves `hr.*` de `localStorage` desde las herramientas del navegador y recarga la página.
- La pantalla **Usuarios y roles** permite restablecer los roles de las cuentas demo; los overrides se guardan en `hr.rolesUsuarios`.

## Cuentas de prueba

| Rol | Correo | Clave | Ficha |
|---|---|---|---|
| Administrador de RRHH | `admin@empresa.cl` | `admin123` | Sin ficha |
| Encargado de Nómina | `felipe.vera@empresa.cl` | `nomina123` | Felipe Vera |
| Jefatura / Supervisor | `ana.torres@empresa.cl` | `super123` | Ana Torres |
| Jefatura / Supervisor | `carla.rojas@empresa.cl` | `super123` | Carla Rojas |
| Empleado | `bruno.diaz@empresa.cl` | `empleado123` | Bruno Díaz |
| Empleado | `elena.munoz@empresa.cl` | `empleado123` | Elena Muñoz |

## Guion de demo de 5 minutos

| Minuto | Rol | Acción | HU |
|---|---|---|---|
| 0:00–0:20 | Administrador | Iniciar sesión y mostrar el panel: dotación, ausentismo, costo de nómina y beneficios. | HU8 / T093 |
| 0:20–0:50 | Administrador | Crear un departamento y un cargo; mostrar validación de nombre/código y bloqueo de borrado con dependencias. | HU1 / HU2 |
| 0:50–1:20 | Administrador | Crear un colaborador y su contrato; mostrar plantilla editable y rechazo de contrato inválido. | HU4 |
| 1:20–1:45 | Empleado | Iniciar sesión como Bruno Díaz, actualizar teléfono y proponer un nuevo dato bancario con certificado. Verificar que el banco queda pendiente y que no se admite una segunda solicitud. | HU3 |
| 1:45–2:05 | Empleado | Enviar una solicitud de vacaciones y mostrar el saldo disponible. | HU5 |
| 2:05–2:35 | Jefatura | Iniciar sesión como Ana Torres, aprobar la solicitud y verificar la actualización del saldo y del calendario. | HU5 |
| 2:35–3:00 | Nómina/Jefatura | Registrar asistencia de un colaborador (también como Encargado de Nómina) y aprobar horas extras del equipo directo. | HU6 / HU9 |
| 3:00–3:30 | Nómina | Crear/ejecutar un período, revisar haberes y deducciones, y descargar una papeleta. | HU7 |
| 3:30–3:40 | Administrador | Cerrar un período y reabrirlo a `Aprobado` para mostrar que solo administración puede hacerlo. | HU7 |
| 3:40–4:00 | Administrador | Aprobar la solicitud bancaria pendiente y mostrar el registro de auditoría. | HU3 / HU8 |
| 4:00–4:20 | Empleado | Ver la papeleta descargada, el estado de sus solicitudes y sus evaluaciones. | HU7 / HU11 |
| 4:20–4:40 | Administrador | Inscribir a un colaborador en un beneficio y mostrar el costo consolidado. | HU10 |
| 4:40–5:00 | Jefatura | Registrar una evaluación de desempeño con calificación decimal y cerrar con el panel de indicadores. | HU11 / HU8 |

## Validaciones que se deben comprobar

- No se puede guardar un departamento o cargo sin nombre/código obligatorio.
- No se puede eliminar un departamento con empleados activos ni un cargo con contratos vigentes.
- Un contrato con fecha de término anterior al inicio o salario menor o igual a cero se rechaza.
- Un empleado no puede ser su propio supervisor ni generar ciclos.
- Una solicitud de permiso con fechas inválidas, superpuesta o sin saldo se rechaza.
- Un registro de asistencia duplicado o con salida anterior a la entrada se rechaza.
- La nómina no permite duplicados por empleado/período ni empleados sin contrato vigente.
- El sueldo líquido siempre es igual al total de haberes menos las deducciones.
- Un usuario fuera de rol no puede acceder por navegación ni por URL directa.
- Un colaborador solo ve sus propias papeletas y evaluaciones.
- Un cambio bancario no se aplica hasta que RRHH lo aprueba, exige certificado de respaldo y bloquea una segunda solicitud pendiente.
- Solo un administrador puede reabrir un período cerrado; al hacerlo vuelve a `Aprobado` y queda auditado.
- El Encargado de Nómina puede registrar y consultar asistencia, pero no validar horas extras.
- La calificación de una evaluación admite decimales entre 1.00 y 5.00.

## Roles de prueba

| Rol | Puede ver | No puede ver |
|---|---|---|
| Administrador de RRHH | Departamentos, cargos, empleados, contratos, beneficios, usuarios y auditoría | Diagnósticos clínicos |
| Encargado de Nómina | Períodos, conceptos, liquidaciones y papeletas | Fichas de personal y datos médicos |
| Jefatura/Supervisor | Permisos, asistencia y evaluaciones de su equipo | Salario base y datos bancarios |
| Empleado | Sus papeletas, solicitudes, beneficios y evaluaciones | Registros de otros colaboradores |

## Solución de problemas

- **No cargan los datos**: revisar que `localStorage` esté habilitado, borrar las claves `hr.*` y recargar.
- **No aparece una pantalla**: verificar el rol de la sesión y la matriz RBAC.
- **Las pruebas fallan por fechas**: usar fechas ISO y una fecha de referencia fija en los datos de prueba.
- **El cálculo de nómina no cuadra**: revisar la clasificación `haber`/`deduccion` de los conceptos y el detalle de la liquidación.
- **Un usuario no puede entrar**: revisar que tenga un rol asignado en **Usuarios y roles**.
