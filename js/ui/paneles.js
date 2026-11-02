/* Paneles laterales: menú de navegación (izquierda) y Mi perfil (derecha) */
(function (global) {
  'use strict';
  const { Api, UI, Ic } = global;
  const { $, $$, esc, campo } = UI;

  const raiz = () => $('#paneles');
  let alCerrar = null;

  function cerrar(despues) {
    const capa = $('.capa', raiz());
    document.removeEventListener('keydown', teclaEsc);
    if (!capa) { if (despues) despues(); return; }
    capa.classList.add('saliendo');
    setTimeout(() => { raiz().innerHTML = ''; if (alCerrar) alCerrar(); alCerrar = null; if (despues) despues(); }, 190);
  }
  function teclaEsc(e) { if (e.key === 'Escape') cerrar(); }

  function abrir(lado, html, montar) {
    const ya = $('.capa', raiz());
    raiz().innerHTML = `<div class="capa capa--${lado}">
      <button class="capa__fondo" data-cerrar aria-label="Cerrar panel" tabindex="-1"></button>
      <div class="lateral" role="dialog" aria-modal="true">${html}</div></div>`;
    const capa = $('.capa', raiz());
    if (ya) $('.lateral', capa).style.animation = 'none'; // cambiar de subpanel sin volver a deslizar
    $$('[data-cerrar]', capa).forEach((b) => (b.onclick = () => cerrar()));
    document.addEventListener('keydown', teclaEsc);
    if (montar) montar(capa);
    const foco = $('input', capa) || $('.lateral button, .lateral a', capa);
    if (foco) setTimeout(() => foco.focus({ preventScroll: true }), 40);
  }

  // ---------------------------------------------------------- Menú lateral
  const ENLACES = [
    ['/calendario', 'Calendario'], ['/tareas', 'Tareas'], ['/materias', 'Materias'],
    ['/simulador', 'Simulador de notas'], ['/flashcards', 'Flashcards'],
  ];
  function menu() {
    const actual = global.App.rutaActual();
    abrir('izq', `
      <div class="lateral__header"><button class="boton-icono" data-cerrar aria-label="Cerrar menú">${Ic('atras')}</button></div>
      <nav class="lateral__cuerpo" aria-label="Menú principal">
        <a class="nav-inicio" href="#/inicio" ${actual === '/inicio' ? 'aria-current="page"' : ''}>${Ic('casa')}Inicio</a>
        <hr class="separador">
        ${ENLACES.map(([r, t]) => `<a class="nav-enlace" href="#${r}" ${actual.startsWith(r) ? 'aria-current="page"' : ''}>${t}</a>`).join('')}
        <button class="nav-enlace" data-perfil>Perfil</button>
      </nav>
      <div class="lateral__pie"><button class="btn btn--rojo btn--bloque" data-salir>Cerrar sesión</button></div>`,
    (capa) => {
      $$('a', capa).forEach((a) => a.addEventListener('click', () => cerrar()));
      $('[data-perfil]', capa).onclick = () => cerrar(() => perfil());
      $('[data-salir]', capa).onclick = salir;
    });
  }

  function salir() {
    cerrar(() => { Api.auth.cerrarSesion(); global.App.ir('/login', 'Cerraste sesión. ¡Vuelve pronto!'); });
  }

  // -------------------------------------------------------------- Mi perfil
  const cabeza = (titulo, volver) => `<div class="lateral__header">
      <button class="boton-icono" ${volver ? 'data-volver' : 'data-cerrar'} aria-label="${volver ? 'Volver' : 'Cerrar perfil'}">${Ic('adelante')}</button>
      <h2 class="lateral__titulo">${titulo}</h2></div>`;

  function perfil() {
    const u = Api.auth.sesion();
    abrir('der', `
      ${cabeza('Mi perfil')}
      <div class="lateral__cuerpo">
        <div class="perfil">
          ${UI.avatar(u.foto)}<button class="avatar__camara" data-sub="foto" aria-label="Cambiar foto de perfil">${Ic('camara')}</button></div>
          <p class="perfil__nombre">${esc(u.nombre)}</p>
          <p class="perfil__correo">${esc(u.correo)}</p>
        </div>
        <hr class="separador">
        <button class="opcion-perfil" data-sub="nombre">${Ic('usuario')}<span>Cambiar nombre</span>${Ic('adelante')}</button>
        <button class="opcion-perfil" data-sub="clave">${Ic('candado')}<span>Cambiar contraseña</span>${Ic('adelante')}</button>
        <button class="opcion-perfil" data-sub="foto">${Ic('camara')}<span>Cambiar foto de perfil</span>${Ic('adelante')}</button>
        <button class="opcion-perfil opcion-perfil--peligro" data-sub="eliminar">${Ic('eliminar')}<span>Eliminar perfil</span>${Ic('adelante')}</button>
      </div>
      <div class="lateral__pie"><button class="btn btn--rojo btn--bloque" data-salir>Cerrar sesión</button></div>`,
    (capa) => {
      $$('[data-sub]', capa).forEach((b) => (b.onclick = () => SUB[b.dataset.sub]()));
      $('[data-salir]', capa).onclick = salir;
    });
  }

  // Subpanel con formulario y botón "Guardar" abajo
  function subpanel(titulo, cuerpo, boton, alEnviar, montar) {
    abrir('der', `${cabeza(titulo, true)}
      <form class="lateral__cuerpo" novalidate style="flex:1">${cuerpo}<p class="error" data-error></p>
        <div style="flex:1"></div>
        ${boton ? `<button class="btn btn--rojo btn--lateral" type="submit">${boton}</button>` : ''}
      </form>`,
    (capa) => {
      $('[data-volver]', capa).onclick = perfil;
      const form = $('form', capa);
      form.onsubmit = (e) => {
        e.preventDefault();
        const r = alEnviar(form);
        if (r && r.ok === false) $('[data-error]', form).textContent = r.error;
      };
      if (montar) montar(capa);
    });
  }

  const SUB = {
    nombre: () => subpanel('Cambiar nombre', `
      <p class="lateral__texto">Asi te saludaremos en la aplicacion</p>
      ${campo('Nuevo nombre', `<input class="input" id="p-nombre" value="${esc(Api.auth.sesion().nombre)}" placeholder="Camila Torres" maxlength="60" autocomplete="name">`, 'p-nombre')}`,
      'Guardar', (form) => {
        const r = Api.perfil.cambiarNombre($('#p-nombre', form).value);
        if (r.ok) { perfil(); global.App.refrescar('Se cambió tu nombre correctamente.'); }
        return r;
      }),

    clave: () => subpanel('Cambiar contraseña', `
      <p class="lateral__texto">Usa mínimo 8 caracteres.</p>
      ${campo('Contraseña actual', '<input class="input" id="p-actual" type="password" autocomplete="current-password" placeholder="••••••••">', 'p-actual')}
      ${campo('Nueva contraseña', '<input class="input" id="p-nueva" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres">', 'p-nueva')}
      ${campo('Confirmar contraseña', '<input class="input" id="p-confirmar" type="password" autocomplete="new-password" placeholder="Repite tu contraseña">', 'p-confirmar')}
      <button type="button" class="enlace" data-olvide style="align-self:flex-end">¿Olvidaste tu contraseña actual?</button>`,
      'Guardar', (form) => {
        const r = Api.perfil.cambiarClave({ actual: $('#p-actual', form).value, clave: $('#p-nueva', form).value, confirmar: $('#p-confirmar', form).value });
        if (r.ok) { perfil(); UI.aviso('Se cambió tu contraseña correctamente.'); }
        return r;
      },
      (capa) => {
        $('[data-olvide]', capa).onclick = () => {
          const correo = Api.auth.sesion().correo;
          cerrar(() => { Api.auth.cerrarSesion(); global.Recuperacion.iniciar(correo); global.App.ir('/nueva-contrasena', 'Crea tu nueva contraseña.'); });
        };
      }),

    foto: () => {
      const u = Api.auth.sesion();
      subpanel('Cambiar foto', `
        <p class="lateral__texto">Elige una foto cuadrada para tu perfil. Se guarda solo en este navegador.</p>
        <div class="perfil" style="padding-top:10px">${UI.avatar(u.foto, 'avatar--grande')}</div></div>
        <input type="file" id="p-archivo" accept="image/*" hidden>
        <button type="button" class="btn btn--crema btn--bloque" data-subir>${Ic('imagen')} Subir foto</button>
        <button type="button" class="btn btn--crema btn--bloque" data-camara>${Ic('camara')} Tomar foto</button>
        <input type="file" id="p-camara" accept="image/*" capture="user" hidden>
        ${u.foto ? `<button type="button" class="opcion-perfil opcion-perfil--peligro" data-quitar style="margin-top:10px">${Ic('eliminar')}<span>Eliminar foto</span>${Ic('adelante')}</button>` : ''}`,
        null, () => {},
        (capa) => {
          const elegir = async (e) => {
            try {
              const dataURL = await UI.leerImagen(e.target.files[0]);
              const r = Api.perfil.cambiarFoto(dataURL);
              if (!r.ok) return UI.aviso(r.error);
              perfil(); UI.aviso('Se actualizó tu foto de perfil.');
            } catch (err) { UI.aviso(err.message); }
          };
          $('#p-archivo', capa).onchange = elegir;
          $('#p-camara', capa).onchange = elegir;
          $('[data-subir]', capa).onclick = () => $('#p-archivo', capa).click();
          $('[data-camara]', capa).onclick = () => $('#p-camara', capa).click();
          const quitar = $('[data-quitar]', capa);
          if (quitar) quitar.onclick = () => SUB.eliminarFoto();
        });
    },

    // LateralBar_EliminarFoto
    eliminarFoto: () => subpanel('Eliminar foto', `
      <div class="perfil" style="padding-top:10px">${UI.avatar(Api.auth.sesion().foto, 'avatar--grande')}</div></div>
      <p class="lateral__texto centro">¿Quieres quitar tu foto de perfil? Volverás a ver el ícono por defecto.</p>`,
      'Eliminar foto', () => {
        const r = Api.perfil.cambiarFoto(null);
        if (r.ok) { perfil(); UI.aviso('Se eliminó tu foto correctamente.'); }
        return r;
      }),

    // LateralBar_EliminarPerfil
    eliminar: () => subpanel('Eliminar perfil', `
      <p class="lateral__texto">Se borrarán tu cuenta, tus materias, tareas, flashcards, notas y tu racha de este navegador. <b>Esta acción no se puede deshacer.</b></p>
      ${campo('Escribe ELIMINAR para confirmar', '<input class="input" id="p-confirma" autocomplete="off" placeholder="ELIMINAR">', 'p-confirma')}`,
      'Eliminar perfil', (form) => {
        if ($('#p-confirma', form).value.trim().toUpperCase() !== 'ELIMINAR') return { ok: false, error: 'Escribe ELIMINAR para confirmar.' };
        UI.confirmar({
          titulo: '¿Eliminar tu perfil?', detalle: Api.auth.sesion().nombre,
          texto: 'Perderás toda tu información guardada en este navegador.',
          alAceptar: () => {
            const r = Api.perfil.eliminarCuenta();
            if (!r.ok) return UI.aviso(r.error);
            cerrar(() => global.App.ir('/login', 'Se eliminó tu perfil correctamente.'));
          },
        });
        return { ok: true };
      }),
  };

  global.Paneles = { menu, perfil, cerrar };
})(window);
