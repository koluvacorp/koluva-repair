# Validación de Koluva Repair 1.0.0

## Versión 1.0.7

- La causa identificada: valores `system` guardados por instalaciones anteriores eran en realidad el valor predeterminado y, con reducción de movimiento en Windows, desactivaban todas las animaciones.
- La migración cambia ese valor heredado a `on`; mantiene `off` explícito y preserva `system` solo después de que el usuario lo elija en Ajustes.
- La prueba de preferencias cubre valor inicial, migración heredada, elección explícita `system` y `off`.
- Publicada el 26-11-2026: [instalador directo 1.0.7](https://github.com/koluvacorp/koluva-repair/releases/download/repair-v1.0.7/KoluvaRepair-1.0.7-Windows-x64-Setup.exe). Release y canal estable HTTP 200; manifiesto ECDSA, tamaño y SHA-256 verificados por la herramienta de publicación.
- `npm test`: 43/43. NSIS x64 compilado. Se cotejaron dentro de `app.asar` la apertura, arranque, preferencias, estilos y configuración contra el código fuente.
- La revisión fue estática/automatizada. No se abrió la app ni se usó la pantalla; queda pendiente la confirmación visual del propietario.
- Retención: releases versionadas 1.0.2–1.0.7; se retiró 1.0.1 después de verificar HTTP 200 en los seis instaladores conservados.

## Versión 1.0.6

- La preferencia global inicia activada en instalaciones nuevas; el sanitizador conserva `off` y `system` cuando forman parte de datos guardados.
- La apertura se ejecuta si está habilitada. Movimiento reducido del sistema aplica un fundido corto; el modo `off` la omite y apaga los efectos visuales.
- Suite automatizada: 43/43 aprobadas. No se abrió la app ni se usó la pantalla; la aceptación visual y la actualización en la PC del propietario quedan pendientes.
- Publicada el 25-11-2026: [instalador directo 1.0.6](https://github.com/koluvacorp/koluva-repair/releases/download/repair-v1.0.6/KoluvaRepair-1.0.6-Windows-x64-Setup.exe). El manifiesto ECDSA valida versión, URL, tamaño y SHA-256; instalador y canal estable respondieron HTTP 200.
- Retención verificada: releases versionadas 1.0.1 a 1.0.6; se retiró 1.0.0 después de verificar los seis instaladores conservados.

## Versión 1.0.3

- Corregido el error exacto de la captura (`S.onStatus is not a function`) mediante la asignación del callback a la propiedad existente.
- Prueba del callback de estado incluida en `npm test`.

## Versión 1.0.2

- El IPC mantiene el control del WebContents principal y la ruta exacta del documento local; se eliminó la condición de jerarquía de frame que podía impedir el acceso al iniciar.
- La pantalla de error conserva el mensaje técnico local para distinguir fallos de IPC, permisos y lectura. No hay telemetría ni envío de diagnóstico.

## Versión 1.0.1

- Pruebas de origen IPC y persistencia: 4/4 aprobadas; el IPC acepta una variación de mayúsculas de la misma ruta local en Windows y rechaza otros archivos, URL remotas, query strings, fragmentos y texto inválido.
- Suite completa: 35/35 pruebas aprobadas.
- La ventana no se abrió durante las pruebas; la confirmación visual e instalación/actualización final queda para la prueba manual del propietario.

## Comprobaciones automatizadas

- `npm test`: 33 pruebas aprobadas, incluidas geometría del isotipo, pedidos, historial, planes/licencias, Google PKCE y OAuth compartido, copias y manifiesto.
- `node --check` en scripts de Electron, interfaz, herramientas y `repair-api.js`: sin errores de sintaxis.
- `npm audit --omit=dev`: 0 vulnerabilidades reportadas en dependencias de producción.
- Build NSIS x64 reproducido con carpeta de instalación elegible, accesos directos, instalación por usuario y conservación de datos al desinstalar.
- Revisión estática de `contextIsolation`, sandbox, Node desactivado en renderer, CSP local, origen IPC, allowlist HTTPS y verificación ECDSA/tamaño/SHA-256 del actualizador.
- Worker: `npm run check:cloudflare` pasa dry-run de API y sitio. Pruebas automatizadas de API/cuenta/admin/otros servicios: 42/42 aprobadas.
- D1 remota: `wrangler d1 migrations list koluva-site --remote` informa que no hay migraciones pendientes. Secretos requeridos presentes en el Worker: `REPAIR_LICENSE_SIGNING_KEY`, `REPAIR_RENEWAL_EMAIL`, además de secretos compartidos de Admin.

## Limitaciones manuales

No se abrió la ventana ni se usó la pantalla del usuario. El propietario probará navegación, Google con una cuenta real, recuperación de correo, instalación y actualización extremo a extremo. No se probó en una PC limpia ni se hizo una auditoría externa de penetración. El instalador no lleva firma Authenticode y SmartScreen puede mostrar editor desconocido.

## Publicación

Publicado y verificado el 2026-11-23: repo público `https://github.com/koluvacorp/koluva-repair`, release `repair-v1.0.0`, instalador y canal estable HTTP 200. SHA-256 y tamaño cotejados contra el manifiesto ECDSA P-256; la firma remota se verificó usando la clave pública del cliente. El API Worker se desplegó en `koluva.com/api/*`; D1 no tiene migraciones pendientes y el Admin web está en Workers Builds verde.

## Datos y recuperación

Órdenes, contactos, fotos, presupuestos e historial permanecen en el perfil local; no se sincronizan. El guardado es atómico y conserva dos copias previas. La cuenta se usa solo para iniciar sesión y administrar licencias. La copia portable contiene datos privados y debe resguardarse; la copia cifrada usa AES-256-GCM y PBKDF2-SHA-256.

El historial SHA-256 detecta modificaciones de la cadena local, pero no certifica la identidad del autor ni la hora real y no es evidencia forense.

