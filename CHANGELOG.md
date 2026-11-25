# Cambios

## 1.0.4 — Apertura y movimiento Koluva

- Restaura la apertura de Koluva con el patrón corporativo compartido y el isotipo blanco de tuerca de Repair.
- Añade entrada escalonada al navegar, respuesta en pestañas y controles, y un reveal breve al cambiar el tema.
- Los efectos se limitan a opacidad y transformaciones; respetan el ajuste de movimiento de Repair y `prefers-reduced-motion`.
- Añade cobertura automática para navegación, apertura y cambio de tema.

## 1.0.3 — Inicio de la interfaz

- Corrige el registro del estado de guardado, que detenía el arranque de la aplicación después de cargar los datos locales.
- Agrega una prueba que comprueba la interfaz correcta del callback del almacén.

## 1.0.2 — Compatibilidad IPC de Electron

- Evita depender de metadatos de jerarquía de frames que pueden variar según el momento de inicio de Electron. Se conserva la validación del WebContents y la ruta exacta del archivo local de Repair.
- La pantalla de recuperación muestra el error técnico local para identificar fallos de permisos o lectura, sin enviarlo a ningún servidor.

## 1.0.1 — Corrección de inicio en Windows

- Corrige la validación del origen local de Electron para admitir diferencias de mayúsculas en rutas de Windows y exigir que la llamada provenga del frame principal de la app.
- Si el inicio encuentra otro problema, muestra una opción accesible para volver a intentarlo sin borrar los datos locales.

## 1.0.0 — Lanzamiento completo para Windows

- Gestión local de órdenes desde recepción hasta entrega: cliente temporal, datos del equipo, estado, prioridad, diagnóstico, accesorios y fecha estimada.
- Historial fechado con rectificaciones que preservan la anotación original, presupuestos versionados y registro de aprobación o rechazo.
- Inventario de repuestos con existencias, mínimos y descuento al asignar piezas a una orden.
- Tipos de equipo personalizables para rubros de reparación generales, además de las categorías habituales.
- Evidencias adjuntas con validación de formato y tamaño; fichas imprimibles A4, Carta, rollos de 58/80 mm y medida personalizada.
- Respaldo local portable con adjuntos y respaldo cifrado con contraseña para Pro Plus.
- Planes mensuales manuales: Gratis (20 órdenes activas y 40 referencias), Pro (100 y 500) y Pro Plus (sin límite práctico y copias cifradas). Los datos quedan visibles y exportables al vencer; se aplican límites Gratis a nuevas operaciones.
- Activación optativa de Pro con consentimiento; viajan únicamente el código de licencia y un identificador aleatorio de PC. Órdenes, clientes, fotos y adjuntos permanecen locales.
- Licencias Ed25519 vinculadas a una PC, gracia offline firmada de hasta siete días, verificación periódica, avisos de vencimiento y control de suscripciones desde el Admin existente de Koluva.
- Español, inglés, francés y portugués; tema de Windows, claro y oscuro; apertura Koluva, movimiento respetuoso de preferencias de accesibilidad y navegación por teclado.
- Instalador NSIS por usuario que permite elegir carpeta y crear accesos directos. Actualizaciones con manifiesto ECDSA firmado, URL versionada, tamaño y SHA-256 verificados.

## 0.1.0 — Preview funcional

- Primera base de órdenes, historial, presupuestos, repuestos, impresión, adjuntos, copias locales, cuatro idiomas y actualización firmada.
- La activación de planes y el control desde Admin todavía no estaban disponibles.
