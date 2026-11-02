/* Enrutador de la aplicación (rutas con #) y arranque */
(function (global) {
  'use strict';
  const { Api, UI, Vistas, Paneles } = global;
  const { $ } = UI;

  // ruta -> nombre de la vista (y argumento)
  function resolver(hash) {
    const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [a, b, c] = partes;
    if (!a) return { nombre: Api.auth.sesion() ? 'inicio' : 'login' };
    if (a === 'materias' && b === 'editar') return { nombre: 'materias/editar', arg: c };
    if (a === 'materias' && b === 'nueva') return { nombre: 'materias/nueva' };
    if (a === 'tareas' && b === 'editar') return { nombre: 'tareas/editar', arg: c };
    if (a === 'flashcards' && b) return { nombre: 'flashcards/materia', arg: b };
    if (a === 'simulador' && b) return { nombre: 'simulador/materia', arg: b };
    return { nombre: a };
  }

  let avisoPendiente = null;
  const rutaActual = () => '/' + location.hash.replace(/^#\/?/, '');

  function ir(ruta, mensaje) {
    avisoPendiente = mensaje || null;
    if (rutaActual() === ruta) pintar();
    else location.hash = ruta;
  }

  // Vuelve a pintar la pantalla actual sin mover el scroll
  function refrescar(mensaje) {
    const y = global.scrollY;
    avisoPendiente = mensaje || null;
    pintar(true);
    global.scrollTo(0, y);
  }

  function pintar(mismaPantalla) {
    let { nombre, arg } = resolver(location.hash);
    const sesion = Api.auth.sesion();
    if (!Vistas[nombre]) nombre = sesion ? 'inicio' : 'login';
    let vista = Vistas[nombre](arg);

    // Rutas protegidas y públicas
    if (!vista.publica && !sesion) { location.replace('#/login'); return; }
    if (vista.publica && sesion && nombre !== 'nueva-contrasena') { location.replace('#/inicio'); return; }

    if (!mismaPantalla) { Paneles.cerrar(); UI.cerrarVentana(); }
    const app = $('#app');
    app.innerHTML = vista.publica
      ? vista.html
      : `${UI.cabecera()}<main class="principal" id="principal">${vista.html}</main>`;

    if (!vista.publica) {
      $('[data-accion="menu"]', app).onclick = Paneles.menu;
      $('[data-accion="perfil"]', app).onclick = Paneles.perfil;
    }
    if (vista.montar) vista.montar(app);
    if (!mismaPantalla) {
      global.scrollTo(0, 0);
      const h1 = $('h1', app);
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    if (avisoPendiente) { UI.aviso(avisoPendiente); avisoPendiente = null; }
  }

  // Cierra los desplegables abiertos al hacer clic afuera
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.desplegable.abierto').forEach((d) => {
      if (!d.contains(e.target)) { d.classList.remove('abierto'); const b = d.querySelector('.desplegable__boton'); if (b) b.setAttribute('aria-expanded', 'false'); }
    });
  });

  global.App = { ir, refrescar, rutaActual };
  global.addEventListener('hashchange', () => pintar());
  // Si se abre la app en otra pestaña y cambian los datos, se actualiza esta
  global.Almacen.alCambiar(() => {});

  if (Api.auth.sesion()) Api.racha.marcar();
  pintar();

  // PWA: se puede instalar y abrir sin internet (solo cuando se sirve por http/https)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    global.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})(window);
