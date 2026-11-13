# Inicio Rápido: Módulo de Recursos Humanos y Planilla (HR / Payroll)

## Estado

El módulo se encuentra **implementado y funcional** como MVP académico. La aplicación incluye los cuatro roles demo, datos semilla, persistencia en `localStorage`, auditoría y 72 pruebas automatizadas.

## Configuración

1. Instalar las dependencias con `npm install`.
2. Iniciar el servidor de desarrollo con `npm run dev`.
3. Abrir la URL local que entrega Vite en el navegador y elegir un perfil demo.
4. Ejecutar las pruebas con `npm test`.
5. Validar el empaquetado con `npm run build`.

## Datos de demostración

- Los datos semilla se cargan desde `src/data/seed.js` y cubren las 14 entidades del modelo.
- La aplicación permite restablecer los datos de demo para repetir la presentación.
- Los usuarios de demo representan los cuatro roles y se seleccionan desde la pantalla de ingreso, sin contraseña:

| Usuario demo | Rol | Nombre |
|---|---|---|
| `ana.torres` | Administrador de RRHH | Ana Torres |
| `diego.soto` | Encargado de Nómina | Diego Soto |
| `gonzalo.paredes` | Jefatura / Supervisor | Gonzalo Paredes |
| `javiera.nunez` | Empleado | Javiera Núñez |

## Flujo de demostración sugerido (5 minutos)

1. **Administrador de RRHH** (0:00–1:00): iniciar sesión, crear un departamento y un cargo (HU1 y HU2), registrar un colaborador y generar su contrato (HU4).
2. **Empleado** (1:00–1:45): actualizar los datos de contacto (HU3) y enviar una solicitud de permiso (HU5).
3. **Jefatura** (1:45–2:45): aprobar o rechazar la solicitud con comentario (HU5), registrar la asistencia diaria (HU6) y validar horas extras (HU9).
4. **Encargado de Nómina** (2:45–3:45): crear un período y ejecutar la liquidación (HU7); verificar la papeleta desde la sesión del empleado.
5. **Administrador de RRHH** (3:45–5:00): revisar el panel con dotación, ausentismo y costo de nómina, inscribir a un colaborador en un beneficio (HU10) y registrar una evaluación de desempeño (HU11).

> **Ensayo automatizado**: los flujos de las 11 HU están cubiertos por las pruebas de integración de `tests/integration/`; ejecutar `npm test` antes de la demo para confirmar el guion completo.

## Validaciones que se deben comprobar

- No se puede guardar un departamento o cargo sin nombre/código obligatorio.
- No se puede eliminar un departamento con empleados activos ni un cargo con contratos vigentes.
- Un contrato con fecha de término anterior al inicio o salario menor o igual a cero se rechaza.
- Un empleado no puede ser su propio supervisor ni generar ciclos.
- Un RUT o correo duplicado se rechaza al crear o editar un colaborador.
- Una solicitud de permiso con fechas inválidas, superpuesta o sin saldo se rechaza.
- Un registro de asistencia duplicado o con salida anterior a la entrada se rechaza.
- Las horas extras solo se consolidan en nómina cuando `estado_validacion` es `aprobado` y no pueden aprobarse dos veces.
- La nómina no permite duplicados por empleado/período ni empleados sin contrato vigente.
- El sueldo líquido siempre es igual al total de haberes menos las deducciones.
- Un usuario fuera de rol no puede acceder por navegación ni por URL directa.
- Un colaborador solo ve sus propias papeletas y evaluaciones.

## Roles de prueba

| Rol | Puede ver | No puede ver |
|---|---|---|
| Administrador de RRHH | Departamentos, cargos, empleados, contratos, beneficios | Datos médicos detallados |
| Encargado de Nómina | Períodos, conceptos, liquidaciones | Fichas de personal y datos médicos |
| Jefatura/Supervisor | Permisos, asistencia y evaluaciones de su equipo | Salario base y datos bancarios |
| Empleado | Sus papeletas, solicitudes y evaluaciones | Registros de otros colaboradores |

## Solución de problemas

- **No cargan los datos**: revisar que `localStorage` esté habilitado y restablecer los datos de demo.
- **No aparece una pantalla**: verificar el rol de la sesión y la matriz RBAC.
- **Las pruebas fallan por fechas**: usar fechas ISO y una fecha de referencia fija en los datos de prueba.
- **El cálculo de nómina no cuadra**: revisar la clasificación `haber`/`deduccion` de los conceptos y el detalle de la liquidación.
