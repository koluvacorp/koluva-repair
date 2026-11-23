# Seguridad y privacidad — Koluva Repair

## Datos locales

El renderer corre en un archivo local con `contextIsolation`, sandbox, Node desactivado, CSP y una API IPC estrecha en `electron/preload.cjs`. El proceso principal acepta IPC solo desde el documento local esperado. Navegación y ventanas nuevas se bloquean. Los adjuntos se admiten únicamente con formatos, firmas binarias y tamaños permitidos.

Órdenes, contactos de clientes, fotos, presupuestos e historial no se envían a Koluva. Permanecen en el perfil local de Windows. La exportación portable contiene esos datos y adjuntos; debe guardarse como información privada. La copia cifrada usa AES-256-GCM con una clave derivada de contraseña mediante PBKDF2-SHA-256 (250.000 iteraciones). Si se pierde la contraseña de una copia cifrada, no se puede recuperar.

La cuenta Koluva es opcional y solo se necesita para activar Pro/Pro Plus. El ingreso por correo usa HTTPS; el ingreso con Google abre el navegador predeterminado y usa PKCE, un `state` aleatorio de un solo uso y el enlace de retorno `koluva-repair://auth`. La app valida el retorno en el proceso principal y cambia el código de autorización por una sesión. La sesión se cifra con `safeStorage` de Electron/Windows; nunca se guarda en el renderer ni se escribe en logs. La confirmación de correo y recuperación de contraseña usan el servicio compartido de cuenta. La cuenta no sincroniza los datos del taller.

La activación paga requiere una aceptación explícita. Después de aceptarla, la app envía por HTTPS el código de licencia, un UUID aleatorio de instalación y la versión de Repair al endpoint fijo `https://koluva.com/api/repair/`. El servidor guarda un hash del código, un hash asociado a la instalación, la cuenta Koluva vinculada, el plan, el estado y las fechas de suscripción; no recibe órdenes, nombres o contactos de clientes, archivos, fotografías ni adjuntos del taller. La clave Ed25519 privada de licencias existe en el vault local para crear el secreto de Cloudflare y nunca se distribuye. La app lleva únicamente la clave pública.

## Suscripciones y modo sin conexión

Una licencia Ed25519 vincula una suscripción con una instalación. Se comprueba en línea cada seis días aproximadamente y la licencia firmada permite como máximo siete días desde su emisión/renovación sin conexión. Si no puede renovarse el permiso antes de ese límite, Repair pasa a las capacidades Gratis hasta conectarse. Una vez vencido el mes no hay período pagado adicional: al siguiente control válido se recibe Gratis. Suspender o cancelar en Admin requiere conexión para que el cambio llegue al equipo, por lo que la licencia ya emitida puede seguir funcionando hasta que venza su concesión offline de siete días.

El reloj local debe avanzar normalmente. Un retroceso detectado bloquea temporalmente las funciones pagas hasta volver a validar en línea. Los datos no se borran cuando el plan vence, se suspende o no hay conexión.

## Actualizador

La app solo consulta el canal estable de este repositorio público. Verifica la firma ECDSA P-256 del manifiesto, valida la versión semántica, exige una URL de descarga versionada del repositorio exacto y verifica tamaño y SHA-256 del instalador. El proceso principal mantiene la instalación; no se descarga ni ejecuta un archivo si falla alguna comprobación. Las descargas de actualizaciones nunca se instalan sin acción del usuario.

La firma del manifiesto no es una firma Authenticode de Windows. SmartScreen puede mostrar advertencia de editor desconocido hasta obtener y mantener un certificado de firma de código.

## Configuración del servicio de licencias

1. Aplicar `migrations/0011_repair_subscriptions.sql` a la D1 existente `koluva-site`; no crear otra base ni borrar tablas.
2. Guardar en el secreto del Worker `koluva-corp` el contenido de `D:\KoluvaVault\06 Seguridad\Koluva Repair\signing\repair-license-private.pem` bajo el nombre `REPAIR_LICENSE_SIGNING_KEY`.
3. Configurar `REPAIR_RENEWAL_EMAIL` como secreto con el correo público de contacto de Koluva. No configurar ni publicar un WhatsApp personal sin una decisión expresa.
4. Desplegar el Worker API del repo `koluvacorp/koluvacorp` manualmente. El contenido del sitio se despliega siguiendo su workflow existente.
5. Abrir Admin → Suscripciones Repair, crear una licencia mensual, entregar el código al cliente por un canal privado y no copiarlo en la página pública.
6. Probar activación, renovación, suspensión, restablecimiento de dispositivo y vencimiento con datos de prueba antes de ofrecer planes al público.

Google aparece con su logotipo oficial sobre el formulario de correo. La ruta de retorno de `koluva.com/book/auth/callback` reconoce una cookie breve `koluva_g_app=repair.<state>` y ofrece un botón para abrir Repair si el navegador bloquea el enlace profundo. El verificador PKCE y el estado expiran a los diez minutos y se conservan cifrados localmente durante el flujo. Las pruebas cubren URL permitida, estado incorrecto o vencido, cancelación y cookie de retorno. El consentimiento de cuenta se registra después del retorno.

La migración es aditiva y usa tablas propias de Repair. La base y las tablas de Ops/Book no se modifican. Las claves privadas locales viven en `D:\KoluvaVault\06 Seguridad\Koluva Repair\signing`, fuera del repositorio y con permisos NTFS limitados a la cuenta propietaria, SYSTEM y Administradores; el vault conserva la clave pública con un nombre explícito. El proyecto nunca debe contener material privado de firma.

## Alcance

Se ejecutan pruebas automatizadas de modelo, licencias, API, traducciones y manifiestos, auditoría de dependencias de producción y compilación. Esto no es una auditoría profesional de penetración ni una garantía de ausencia de vulnerabilidades o puertas traseras. Las operaciones remotas se limitan al canal firmado de actualizaciones y, por consentimiento, la API de licencias. Revisá cambios de dependencias y artefactos antes de publicar futuras versiones.
