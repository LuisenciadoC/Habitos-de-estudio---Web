/* =====================================================================
   Hábitos de Estudio · Backend local
   almacen.js — Capa de persistencia sobre localStorage.

   Toda la información vive en una sola llave del navegador. Esta capa
   solo sabe leer, escribir y migrar; las reglas de negocio están en api.js.
   ===================================================================== */
(function (global) {
  'use strict';

  const LLAVE = 'habitos-estudio-web';
  const VERSION = 1;

  const vacia = () => ({ version: VERSION, usuarios: {}, sesion: null });

  let cache = null;
  const oyentes = new Set();

  function leer() {
    if (cache) return cache;
    try {
      const crudo = localStorage.getItem(LLAVE);
      cache = crudo ? JSON.parse(crudo) : vacia();
    } catch (e) {
      cache = vacia();
    }
    migrar(cache);
    return cache;
  }

  // Deja los datos en la forma que espera la versión actual de la app.
  function migrar(db) {
    db.usuarios = db.usuarios || {};
    if (!('sesion' in db)) db.sesion = null;
    Object.values(db.usuarios).forEach((u) => {
      u.datos = u.datos || {};
      const d = u.datos;
      d.materias = d.materias || [];
      d.tareas = d.tareas || [];
      d.flashcards = d.flashcards || [];
      d.notas = d.notas || {};
      d.racha = d.racha || { dias: 0, ultimo: null };
    });
    db.version = VERSION;
  }

  function guardar() {
    try {
      localStorage.setItem(LLAVE, JSON.stringify(cache));
      oyentes.forEach((fn) => fn());
      return true;
    } catch (e) {
      // QuotaExceededError: normalmente por fotos de perfil muy grandes
      return false;
    }
  }

  // Si otra pestaña cambia los datos, se recargan aquí también.
  global.addEventListener && global.addEventListener('storage', (e) => {
    if (e.key !== LLAVE) return;
    cache = null;
    leer();
    oyentes.forEach((fn) => fn());
  });

  global.Almacen = {
    leer,
    guardar,
    alCambiar: (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
    borrarTodo: () => { localStorage.removeItem(LLAVE); cache = null; return leer(); },
    exportar: () => JSON.stringify(leer(), null, 2),
  };
})(window);
