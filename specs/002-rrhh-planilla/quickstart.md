# Inicio Rápido: Módulo de Recursos Humanos y Planilla (HR / Payroll)

## Estado

El módulo se encuentra **implementado y funcional** como MVP académico. La aplicación incluye los cuatro roles demo, datos semilla, persistencia en `localStorage`, auditoría y 63 pruebas automatizadas.

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

## Flujo de demostración sugerido

1. Iniciar sesión como **Administrador de RRHH**.
2. Crear un departamento y un cargo (HU1 y HU2).
3. Registrar un colaborador y generar su contrato (HU4).
4. Iniciar sesión como **Empleado** y actualizar los datos de contacto (HU3).
5. Enviar una solicitud de permiso (HU5).
6. Iniciar sesión como **Jefatura** y aprobar o rechazar la solicitud (HU5).
7. Registrar la asistencia diaria del equipo (HU6).
8. Validar y aprobar horas extras (HU9).
9. Iniciar sesión como **Encargado de Nómina**, crear un período y ejecutar la liquidación (HU7).
10. Verificar la papeleta desde la sesión del empleado (HU7).
11. Revisar el panel de RRHH con dotación, ausentismo y costo de nómina.
12. Inscribir a un colaborador en un beneficio (HU10) y registrar una evaluación de desempeño (HU11).

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
