Feedback Avance 01 (26/10/26)

- plan y data-model Deben existir como una modulo de desarrollo dentro de specs
- plan y data-model Deben preserver estructura central (la imagen es solo referencial)
- preserver informacion clave del README en base a template (no solo dejar vision de producto)

Proximos pasos:
 
- rectificar puntos anteriores 
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

 Feedback Avance 02 (2/11/26)

- Se insiste en el manejo de los specs (revisar video). Hay archivos de spec en la raiz del proyecto
- no se observan historias de usuario por cada miembro del grupo
- Evitar trabajar con modelos de IA fuera de speckit en local, porque crean ramas nuevas y se pierde la integridad del proyecto

Proximos pasos:

- rectificar puntos anteriores y crear tareas a partir de los specs
- hacer primera implmentacion, registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

Cambios en la especificacion:

- spec.md y tasks.md son nuevos (carpeta 002-rrhh-planilla): 11 HU, FR-001 en adelante y T001-T087, todas marcadas [X].
- Los cambios del 12/11 (RUT unico, datos bancarios, estado_validacion, horas_extras_aprobadas) estan en FR-006, FR-010, FR-026 y T031, T067. Ambos archivos son coherentes entre si, pero spec.md sigue en "Borrador" mientras tasks.md declara el MVP completado.

Consistencia sitio-especificacion:

- T060 (pantalla de usuarios y roles) figura hecha, pero `VIEWS` en src/app.js no tiene ninguna ruta de usuarios. Solo se ve `changeRole` en la logica y su prueba. No verificable en las vistas no incluidas.
- HU10 (escenario 5) prohibe eliminar un beneficio con inscripciones historicas. tests/integration/benefits.test.js elimina el beneficio 3 tras finalizar su inscripcion.
- La vista `auditoria` (src/hr/components/audit-view.js) no tiene HU ni tarea. FR-034 solo exige auditar la reapertura.
- T084 dice "suite completa", pero vitest.config.mjs excluye los tests del modulo 001. Para T083 (500 empleados) no se ve ninguna prueba.
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.
