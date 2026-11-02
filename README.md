# Hábitos de Estudio · Web

Versión web de **Hábitos de Estudio**, construida a partir del diseño de Figma *Hábitos de estudio Web* y de la lógica de la app móvil ([Habitos-de-estudio---Movil](https://github.com/LuisenciadoC/Habitos-de-estudio---Movil)).

Organiza materias y horarios, tareas, flashcards y notas, con racha de días, pomodoro y simulador de notas. No necesita servidor ni base de datos: todo se guarda en el navegador con `localStorage`.

## Cómo abrirla

- **Sin instalar nada:** descarga el proyecto y abre `index.html` con doble clic.
- **Con servidor local** (recomendado para probar el modo sin internet):
  ```bash
  python -m http.server 8000
  # luego abre http://localhost:8000
  ```
- **GitHub Pages:** sube el repositorio, entra a *Settings → Pages*, elige la rama `main` y la carpeta `/ (root)`. La app queda publicada en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Para probar con datos de ejemplo, en el login usa **Continuar con Google** y elige una de las cuentas de prueba (por ejemplo Camila Torres).

## Qué incluye

| Pantalla | Funciones |
|---|---|
| Login, Crear cuenta | Registro con validaciones, inicio de sesión, "Continuar con Google" con cuentas de prueba |
| Recuperar / Nueva contraseña | Verifica el correo y permite crear una nueva contraseña |
| Inicio (Dashboard) | Promedio del semestre, número de materias, tareas pendientes, progreso por materia, pomodoro y acceso a flashcards |
| Calendario | Vista mensual, días con tareas marcados, clases y tareas del día elegido, marcar tareas como hechas |
| Tareas | Pendientes y hechas, crear (ventana), editar (pantalla), marcar y eliminar con confirmación |
| Materias | Varios horarios por materia, cada uno con su propio salón, día y hora; crear, editar y eliminar |
| Simulador de notas | Número de periodos y porcentajes editables; calcula la nota que falta para aprobar con 3,0 |
| Flashcards | Repaso con tarjetas que se voltean, elegir materia, mazos por materia, crear, editar y eliminar |
| Menú lateral y Mi perfil | Navegación, cambiar nombre, contraseña y foto, eliminar foto, eliminar perfil, cerrar sesión |
| Avisos | Ventanas de confirmación para eliminar y mensajes de éxito en la parte inferior |

La interfaz se adapta sola al tamaño de la ventana: el diseño base es de 1440 px y se reorganiza en pantallas medianas, tabletas y celulares.

## Estructura del proyecto

```
├── index.html              Página única de la aplicación
├── css/estilos.css         Estilos (colores, tipografía y componentes del Figma)
├── js/
│   ├── backend/
│   │   ├── almacen.js      Lectura y escritura en localStorage
│   │   └── api.js          Reglas de negocio: cuentas, materias, tareas, flashcards, notas, racha
│   ├── ui/
│   │   ├── iconos.js       Íconos SVG
│   │   ├── componentes.js  Cabecera, avisos, ventanas, desplegable, pomodoro
│   │   └── paneles.js      Menú lateral y panel de perfil
│   ├── vistas/             Una por sección (auth, inicio, tareas, materias, flashcards)
│   └── app.js              Rutas (#/inicio, #/tareas, …) y arranque
├── icons/                  Íconos de la app
├── manifest.json, sw.js    Instalación como app (PWA) y uso sin internet
```

### El "backend"

`js/backend/api.js` funciona como el servidor de la app pero corre dentro del navegador. La interfaz nunca toca los datos directamente: siempre llama a funciones como `Api.tareas.guardar(...)` o `Api.notas.calcular(...)`, que validan la información y responden `{ ok, valor }` o `{ ok: false, error }`. Si más adelante se quiere un servidor real (por ejemplo Flask), solo hay que reemplazar esta capa por llamadas `fetch` sin tocar las pantallas.

## Diseño

| Rol | Color | Borde | Texto |
|---|---|---|---|
| Primario | `#9FB2AC` | `#7D8E89` | `#4E605A` |
| Acento | `#5D0D18` | `#3D070F` | `#FFF9EB` |
| Fondo | `#FFF9EB` | `#D9CFBB` (1.5 px) | — |

- Tipografía: **Lora** para títulos y **Nunito** para el cuerpo, en tamaños de 35, 30, 25, 20 y 15 px.
- Esquinas de 45 px, botones en forma de píldora, separación de 20 px y rellenos de 25 × 15 px.

## Cómo se guardan los datos

Todo vive en la llave `habitos-estudio-web` del `localStorage` del navegador. Por eso:

- Los datos no se comparten entre dispositivos ni navegadores.
- Se borran si se limpian los datos del sitio.
- Las contraseñas se guardan como huella (no en texto plano), pero sin servidor no hay seguridad real: no uses contraseñas importantes.
- "Continuar con Google" no conecta con Google; muestra cuentas de prueba y las cuentas creadas en ese navegador.

## Tecnologías

HTML, CSS y JavaScript sin frameworks ni dependencias. No hay que instalar nada ni compilar.
