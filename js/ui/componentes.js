/* Piezas de interfaz compartidas: utilidades, avisos, ventanas, cabecera, desplegable y pomodoro. */
(function (global) {
  'use strict';

  const { util } = global.Api;
  const Ic = global.Ic;

  // ------------------------------------------------------------- utilidades
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS_CORTOS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  // "20:00" -> "8:00 p.m"
  function hora12(h, conCero = false) {
    if (!h) return '';
    let [hh, mm] = h.split(':').map(Number);
    const sufijo = hh >= 12 ? 'p.m' : 'a.m';
    hh = hh % 12 || 12;
    return `${conCero ? util.pad(hh) : hh}:${util.pad(mm)} ${sufijo}`;
  }
  // "20:00" -> "8:00 pm" (como en la lista de materias)
  const hora12Corta = (h) => hora12(h).replace('.', '');

  // Etiqueta corta para la fecha de una tarea: "Vence hoy", "Vie, 26 sep"
  function etiquetaFecha(iso) {
    if (!iso) return 'Sin fecha';
    const h = util.hoy();
    if (iso === h) return 'Vence hoy';
    if (iso === util.sumarDias(h, 1)) return 'Vence mañana';
    if (iso === util.sumarDias(h, -1)) return 'Venció ayer';
    const d = util.deISO(iso);
    return `${DIAS_CORTOS[util.indiceDia(d)]}, ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
  }

  // Divide "HH:MM" en partes para los selectores de 12 horas
  function partesHora(h) {
    let [hh, mm] = (h || '08:00').split(':').map(Number);
    return { hora: `${hh % 12 || 12}:${util.pad(mm)}`, ampm: hh >= 12 ? 'PM' : 'AM' };
  }
  function unirHora(hora, ampm) {
    let [hh, mm] = hora.split(':').map(Number);
    hh = (hh % 12) + (ampm === 'PM' ? 12 : 0);
    return `${util.pad(hh)}:${util.pad(mm)}`;
  }
  const OPCIONES_HORA = [];
  for (let h = 1; h <= 12; h++) ['00', '15', '30', '45'].forEach((m) => OPCIONES_HORA.push(`${h}:${m}`));
  // Ordena 12:xx primero, como un reloj
  OPCIONES_HORA.sort((a, b) => ((+a.split(':')[0] % 12) * 60 + +a.split(':')[1]) - ((+b.split(':')[0] % 12) * 60 + +b.split(':')[1]));

  function selectorHora(nombre, valor) {
    const p = partesHora(valor);
    // Si la hora guardada no está en la lista (ej. 11:59), se agrega para no perderla
    const opciones = OPCIONES_HORA.includes(p.hora) ? OPCIONES_HORA : [p.hora, ...OPCIONES_HORA];
    return `<select class="select" data-hora="${nombre}" aria-label="Hora">${opciones.map((o) => `<option ${o === p.hora ? 'selected' : ''}>${o}</option>`).join('')}</select>
      <select class="select" data-ampm="${nombre}" aria-label="a.m. o p.m."><option ${p.ampm === 'AM' ? 'selected' : ''}>AM</option><option ${p.ampm === 'PM' ? 'selected' : ''}>PM</option></select>`;
  }
  const leerHora = (raiz, nombre) => unirHora($(`[data-hora="${nombre}"]`, raiz).value, $(`[data-ampm="${nombre}"]`, raiz).value);

  // ------------------------------------------------------------------ aviso
  let temporizadorAviso;
  function aviso(mensaje) {
    const raiz = $('#avisos');
    clearTimeout(temporizadorAviso);
    raiz.innerHTML = `<div class="aviso" role="status">${esc(mensaje)}</div>`;
    temporizadorAviso = setTimeout(() => {
      const el = $('.aviso', raiz); if (!el) return;
      el.classList.add('saliendo');
      setTimeout(() => { if (el.parentNode) el.remove(); }, 300);
    }, 2800);
  }

  // ---------------------------------------------------------------- ventanas
  let alCerrarVentana = null;
  function cerrarVentana() {
    $('#ventanas').innerHTML = '';
    document.removeEventListener('keydown', escVentana);
    const fn = alCerrarVentana; alCerrarVentana = null;
    if (fn) fn();
  }
  function escVentana(e) { if (e.key === 'Escape') cerrarVentana(); }
  function abrirVentana(html, { alCerrar } = {}) {
    const raiz = $('#ventanas');
    raiz.innerHTML = `<div class="modal" data-fondo>${html}</div>`;
    alCerrarVentana = alCerrar || null;
    $('[data-fondo]', raiz).addEventListener('mousedown', (e) => { if (e.target.hasAttribute('data-fondo')) cerrarVentana(); });
    document.addEventListener('keydown', escVentana);
    const foco = $('input, select, textarea, [data-foco]', raiz) || $('button', raiz);
    if (foco) setTimeout(() => foco.focus(), 30);
    return raiz;
  }

  // Ventana de confirmación (Overlay_EliminarMateria / Tarea / Flashcard)
  function confirmar({ titulo, detalle = '', texto = '', boton = 'Eliminar', icono = 'eliminar', alAceptar }) {
    const raiz = abrirVentana(`<div class="modal__ventana" role="alertdialog" aria-modal="true" aria-labelledby="v-titulo">
      <div class="modal__icono">${Ic(icono)}</div>
      <h2 class="modal__titulo" id="v-titulo">${esc(titulo)}</h2>
      ${detalle ? `<p class="modal__detalle">${esc(detalle)}</p>` : ''}
      ${texto ? `<p class="modal__texto">${esc(texto)}</p>` : ''}
      <div class="modal__botones">
        <button class="btn btn--rojo btn--modal" data-no>Cancelar</button>
        <button class="btn btn--rojo btn--modal" data-si data-foco>${esc(boton)}</button>
      </div></div>`);
    $('[data-no]', raiz).onclick = cerrarVentana;
    $('[data-si]', raiz).onclick = () => { cerrarVentana(); alAceptar(); };
  }

  // Ventana con formulario (Overlay_CrearTarea, Overlay_NuevaFlashcard)
  function ventanaFormulario({ titulo, cuerpo, boton = 'Guardar', alMontar, alGuardar }) {
    const raiz = abrirVentana(`<form class="modal__ventana modal__ventana--form form-compacto" role="dialog" aria-modal="true" aria-labelledby="v-titulo" novalidate>
      <h2 class="modal__titulo" id="v-titulo">${esc(titulo)}</h2>
      ${cuerpo}
      <p class="error" data-error></p>
      <div class="modal__botones">
        <button type="button" class="btn btn--rojo btn--medio" data-no>Cancelar</button>
        <button type="submit" class="btn btn--rojo btn--medio">${esc(boton)}</button>
      </div></form>`);
    const form = $('form', raiz);
    $('[data-no]', raiz).onclick = cerrarVentana;
    if (alMontar) alMontar(form);
    form.onsubmit = (e) => {
      e.preventDefault();
      const r = alGuardar(form);
      if (r && r.ok === false) { $('[data-error]', form).textContent = r.error; return; }
      cerrarVentana();
    };
  }

  // ------------------------------------------------------- campo genérico
  const campo = (etiqueta, control, id) => `<label class="campo"${id ? ` for="${id}"` : ''}><span class="campo__label">${esc(etiqueta)}</span>${control}</label>`;

  function opcionesMaterias(seleccion) {
    const ms = global.Api.materias.listar();
    return `<option value="" disabled ${seleccion ? '' : 'selected'}>Selecciona la materia</option>` +
      ms.map((m) => `<option value="${m.id}" ${m.id === seleccion ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('');
  }

  // ------------------------------------------------------ desplegable propio
  // Botón "Selecciona la materia" con lista de opciones (SeleccionarMateriasWeb)
  function desplegable({ id, texto, opciones, seleccion }) {
    const actual = opciones.find((o) => o.valor === seleccion);
    return `<div class="desplegable" id="${id}">
      <button type="button" class="desplegable__boton" aria-haspopup="listbox" aria-expanded="false"><span>${esc(actual ? actual.texto : texto)}</span>${Ic('abajo')}</button>
      <div class="desplegable__lista" role="listbox">
        ${opciones.map((o) => `<button type="button" class="desplegable__opcion" role="option" data-valor="${esc(o.valor)}" aria-selected="${o.valor === seleccion}">${esc(o.texto)}</button>`).join('') || '<p class="vacio">No hay materias.</p>'}
      </div></div>`;
  }
  function activarDesplegable(el, alElegir) {
    if (!el) return;
    const boton = $('.desplegable__boton', el);
    const cerrar = () => { el.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false'); };
    boton.onclick = (e) => {
      e.stopPropagation();
      const abrir = !el.classList.contains('abierto');
      el.classList.toggle('abierto', abrir);
      boton.setAttribute('aria-expanded', String(abrir));
    };
    $$('.desplegable__opcion', el).forEach((o) => (o.onclick = () => { cerrar(); alElegir(o.dataset.valor); }));
    // El cierre al hacer clic afuera lo maneja app.js con un solo oyente global.
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cerrar(); boton.focus(); } });
  }

  // --------------------------------------------------------------- cabecera
  function cabecera() {
    const r = global.Api.racha.actual();
    return `<header class="header">
      <div class="header__grupo">
        <button class="boton-icono ic-50" data-accion="menu" aria-label="Abrir menú">${Ic('menu')}</button>
        <a class="boton-icono ic-50 solo-escritorio" href="#/inicio" aria-label="Inicio">${Ic('casa')}</a>
      </div>
      <a class="header__marca" href="#/inicio">Habitos de Estudio</a>
      <div class="header__grupo header__grupo--der">
        <a class="boton-icono ic-43 solo-escritorio" href="#/calendario" aria-label="Calendario">${Ic('calendario')}</a>
        <a class="boton-icono ic-43 solo-escritorio" href="#/simulador" aria-label="Simulador de notas">${Ic('calculadora')}</a>
        <span class="racha ${r.activa ? 'racha--activa' : r.dias ? '' : 'racha--apagada'}" title="Días seguidos estudiando">${Ic('fuego')}<span>${r.dias}</span></span>
        <button class="boton-icono ic-45" data-accion="perfil" aria-label="Mi perfil">${Ic('perfil')}</button>
      </div>
    </header>`;
  }

  // ----------------------------------------------------------- ilustración
  function ilustracion() {
    const notas = [
      ['reloj', 'Organiza tu tiempo', 'Metas pequeñas y un horario que puedas cumplir.'],
      ['ojo', 'Descansa la vista', 'Cada 20 minutos, mira algo lejano por 20 segundos.'],
      ['viento', 'Haz pausas', 'Levántate, estírate y respira profundo un momento.'],
      ['luna', 'Duerme bien', 'Un buen descanso ayuda a recordar lo aprendido.'],
      ['vaso', 'Hidrátate', 'Ten un vaso de agua cerca mientras estudias.'],
      ['brote', 'Espacio tranquilo', 'Un lugar ordenado, con luz suave y sin ruido.'],
    ];
    return `<div class="ilustracion" aria-hidden="true">
      <span class="ilustracion__burbuja"></span><span class="ilustracion__burbuja"></span><span class="ilustracion__burbuja"></span><span class="ilustracion__burbuja"></span>
      <div class="ilustracion__cabeza"><p class="ilustracion__titulo">Hábitos de estudio</p><p class="ilustracion__lema">aprende con calma, a tu propio ritmo</p></div>
      <div class="ilustracion__notas">${notas.map(([i, t, p]) => `<div class="nota">${Ic(i)}<h3>${t}</h3><p>${p}</p></div>`).join('')}</div>
      <p class="ilustracion__pie">respira · enfócate · avanza</p>
    </div>`;
  }

  // ---------------------------------------------------------------- pomodoro
  // Sigue corriendo aunque se cambie de pantalla.
  const pomo = { minutos: 30, restante: 30 * 60, corriendo: false, fase: 'Estudio', guardado: null, timer: null };
  const formato = (s) => `${util.pad(Math.floor(s / 3600))}:${util.pad(Math.floor((s % 3600) / 60))}:${util.pad(s % 60)}`;

  function sonar() {
    try {
      const ctx = new (global.AudioContext || global.webkitAudioContext)();
      [0, .35].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(.25, ctx.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + t + .3);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .32);
      });
    } catch (e) { /* sin audio */ }
  }
  function pomoTick() {
    if (pomo.restante > 0) pomo.restante--;
    if (pomo.restante === 0) {
      pomoParar(); sonar();
      if (pomo.fase === 'Estudio') { global.Api.racha.marcar(); pomo.fase = 'Descanso'; pomo.guardado = null; pomo.restante = 5 * 60; aviso('¡Tiempo de descanso! Tómate 5 minutos.'); }
      else { volverAEstudiar(); aviso('¡A estudiar de nuevo!'); }
    }
    pomoRefrescar();
  }
  function pomoIniciar() { if (pomo.corriendo) return; pomo.corriendo = true; pomo.timer = setInterval(pomoTick, 1000); }
  function pomoParar() { pomo.corriendo = false; clearInterval(pomo.timer); }
  function volverAEstudiar() { pomo.fase = 'Estudio'; pomo.restante = pomo.guardado || pomo.minutos * 60; pomo.guardado = null; }

  const pomodoro = () => `<div class="tarjeta pomodoro ${pomo.fase === 'Descanso' ? 'pomodoro--descanso' : ''}" data-pomo-caja>
      <p class="pomodoro__fase" data-pomo-fase>${pomo.fase}</p>
      <div class="pomodoro__contador">
        <button class="pomodoro__ajuste" data-pomo="menos" aria-label="Quitar 5 minutos">−</button>
        <span class="pomodoro__tiempo" data-pomo-tiempo role="timer">${formato(pomo.restante)}</span>
        <button class="pomodoro__ajuste" data-pomo="mas" aria-label="Agregar 5 minutos">+</button>
      </div>
      <div class="pomodoro__botones">
        <button class="btn btn--rojo btn--pildora" data-pomo="iniciar">Iniciar</button>
        <button class="btn btn--rojo btn--pildora" data-pomo="pausar">Pausar</button>
        <button class="btn btn--rojo btn--pildora" data-pomo="descansar" data-pomo-alt>${pomo.fase === 'Descanso' ? 'Estudiar' : 'Descansar'}</button>
      </div></div>`;

  function activarPomodoro(raiz) {
    $$('[data-pomo]', raiz).forEach((b) => (b.onclick = () => {
      const a = b.dataset.pomo;
      if (a === 'mas' || a === 'menos') {
        if (pomo.corriendo) { aviso('Pausa el pomodoro para cambiar el tiempo.'); return; }
        pomo.minutos = Math.min(120, Math.max(5, pomo.minutos + (a === 'mas' ? 5 : -5)));
        pomo.fase = 'Estudio'; pomo.guardado = null; pomo.restante = pomo.minutos * 60;
      }
      if (a === 'iniciar') pomoIniciar();
      if (a === 'pausar') pomoParar();
      if (a === 'descansar') {
        pomoParar();
        if (pomo.fase === 'Descanso') { volverAEstudiar(); pomoIniciar(); aviso('¡De vuelta a estudiar!'); }
        else { pomo.guardado = pomo.restante; pomo.fase = 'Descanso'; pomo.restante = 5 * 60; pomoIniciar(); aviso('¡Tiempo de descanso!'); }
      }
      pomoRefrescar();
    }));
    pomoRefrescar();
  }
  function pomoRefrescar() {
    $$('[data-pomo-tiempo]').forEach((el) => (el.textContent = formato(pomo.restante)));
    $$('[data-pomo-fase]').forEach((el) => (el.textContent = pomo.fase));
    $$('[data-pomo-alt]').forEach((el) => (el.textContent = pomo.fase === 'Descanso' ? 'Estudiar' : 'Descansar'));
    $$('[data-pomo-caja]').forEach((el) => el.classList.toggle('pomodoro--descanso', pomo.fase === 'Descanso'));
    $$('[data-pomo="iniciar"]').forEach((el) => el.classList.toggle('activo', pomo.corriendo));
    document.title = pomo.corriendo ? `${formato(pomo.restante).slice(3)} · ${pomo.fase} · Hábitos de Estudio` : 'Hábitos de Estudio';
  }

  // --------------------------------------------------------- foto de perfil
  function leerImagen(archivo, lado = 320) {
    return new Promise((ok, mal) => {
      if (!archivo || !/^image\//.test(archivo.type)) return mal(new Error('El archivo no es una imagen.'));
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const k = Math.max(lado / img.width, lado / img.height);
        c.width = c.height = lado;
        c.getContext('2d').drawImage(img, (lado - img.width * k) / 2, (lado - img.height * k) / 2, img.width * k, img.height * k);
        URL.revokeObjectURL(img.src);
        ok(c.toDataURL('image/jpeg', .85));
      };
      img.onerror = () => mal(new Error('No se pudo leer la imagen.'));
      img.src = URL.createObjectURL(archivo);
    });
  }
  const avatar = (foto, clase = '') => `<div class="avatar ${clase}">${foto ? `<img class="avatar__img" src="${foto}" alt="Foto de perfil">` : `<span class="avatar__vacio">${Ic('usuario')}</span>`}`;

  global.UI = {
    $, $$, esc, MESES, DIAS_CORTOS, hora12, hora12Corta, etiquetaFecha,
    selectorHora, leerHora, aviso, abrirVentana, cerrarVentana, confirmar, ventanaFormulario,
    campo, opcionesMaterias, desplegable, activarDesplegable, cabecera, ilustracion,
    pomodoro, activarPomodoro, leerImagen, avatar,
  };
})(window);
