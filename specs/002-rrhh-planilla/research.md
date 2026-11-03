# Investigación: Módulo de Recursos Humanos y Planilla (HR / Payroll)

## Decisión: Aplicación web ligera con Vite, HTML, CSS y JavaScript vanilla

**Justificación**: El módulo base ya define una arquitectura ligera y sin framework pesado. Reutilizarla reduce el riesgo de integración, mantiene el foco en las reglas de negocio de RRHH y facilita que cualquier integrante pueda entender y modificar el código. Vite entrega un servidor de desarrollo rápido y un build simple; Vitest permite probar la lógica y los flujos con jsdom.

**Alternativas consideradas**:

- **React o Vue**: ofrecen componentes y estado más estructurados, pero agregan una curva de aprendizaje y dependencias que no son necesarias para el alcance del curso.
- **Backend con base de datos**: permitiría multiempresa y persistencia real, pero excede el alcance del MVP y retrasa la demo.
- **Aplicación de escritorio**: no aporta ventajas para una demo web y complica la distribución.

## Decisión: Persistencia en `localStorage` con datos semilla

**Justificación**: El MVP es una demo de un único espacio de trabajo. `localStorage` permite persistir las 14 entidades sin infraestructura y los datos semilla (`src/data/seed.js`) garantizan una presentación reproducible. La capa de almacenamiento queda aislada para poder reemplazarla por un backend en el futuro.

**Consecuencias**:

- Los datos viven en el navegador del usuario y se pueden restablecer desde la aplicación.
- Las pruebas de integración pueden precargar `localStorage` con datos controlados.
- No hay concurrencia real ni multiusuario; el RBAC es una simulación de sesión.

## Decisión: RBAC simulado en el cliente

**Justificación**: No hay autenticación real en el alcance. Los roles se asignan a usuarios de demo y la matriz de permisos se evalúa en el cliente para ocultar pantallas, acciones y campos sensibles. Esto permite demostrar el control de acceso sin construir un servidor de identidad.

**Riesgo aceptado**: un usuario con acceso al código podría manipular la sesión. Se mitiga dejando claro en la documentación que es un prototipo académico y que la autorización real requiere backend.

## Decisión: Cálculo de nómina en memoria

**Justificación**: El volumen de la demo es pequeño (decenas de colaboradores) y el cálculo es determinista: haberes menos deducciones. Se implementa como una función pura en `src/hr/payroll.js`, fácil de probar y reutilizar.

**Fórmula**:

```text
total_haberes = suma(DETALLES_LIQUIDACION donde CONCEPTOS_NOMINA.tipo_concepto = "haber")
total_deducciones = suma(DETALLES_LIQUIDACION donde CONCEPTOS_NOMINA.tipo_concepto = "deduccion")
sueldo_liquido = total_haberes - total_deducciones
```

## Decisión: Separar el módulo de RRHH del módulo base

**Justificación**: El módulo base (`001`) debe permanecer estable y reutilizable. Las reglas de RRHH viven en `src/hr/` y consumen el marco, los estilos y los contratos del módulo base. Así se evita mezclar requisitos de dominio con la infraestructura y se facilita la mantención.

## Decisiones adicionales

- Los formularios usan controles nativos accesibles y validación explícita antes de persistir.
- Las fechas se almacenan en formato ISO `YYYY-MM-DD` y se validan como fechas de calendario.
- Los montos se almacenan como números y se formatean como CLP en la interfaz.
- Los datos sensibles (salario, banco, salud) se filtran en la capa de presentación según el rol.
- Las acciones sensibles (cambio de salario, banco, rol y reapertura de nómina) generan un registro de auditoría.
- Las pruebas unitarias cubren reglas de negocio y las de integración cubren los flujos de cada HU.
