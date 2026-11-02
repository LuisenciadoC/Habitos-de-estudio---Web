/* Dashboard (Inicio) y Calendario */
(function (global) {
  'use strict';
  const { Api, UI, Ic } = global;
  const { $, $$, esc } = UI;
  const V = global.Vistas = global.Vistas || {};

  // ---------------------------------------------------------------- Inicio
  function mensajePromedio(p) {
    if (p === null) return 'Registra tus notas en el simulador';
    if (p >= 4) return '¡Has mejorado tu nota!';
    if (p >= 3) return '¡Vas aprobando, sigue así!';
    return '¡Tú puedes subir esa nota!';
  }

  V.inicio = () => {
    const r = Api.estadisticas.resumen();
    const progreso = Api.estadisticas.progreso();
    const prom = r.promedio === null ? '0.0' : r.promedio.toFixed(1);
    return {
      html: `
      <section class="resumen">
        <a class="tarjeta-resumen" href="#/simulador">
          <h2 class="titulo-tarjeta">Promedio semestre</h2>
          <p class="tarjeta-resumen__valor">${prom}<small>/5.0</small></p>
          <p class="tarjeta-resumen__mensaje">${mensajePromedio(r.promedio)}</p>
        </a>
        <a class="tarjeta-resumen" href="#/materias">
          <h2 class="titulo-tarjeta"># Materias</h2>
          <p class="tarjeta-resumen__valor">${r.materias}</p>
          <p class="tarjeta-resumen__mensaje">${r.materias ? '¡Wow, Eres increible!' : 'Agrega tu primera materia'}</p>
        </a>
        <a class="tarjeta-resumen" href="#/tareas">
          <h2 class="titulo-tarjeta">Tareas pendientes</h2>
          <p class="tarjeta-resumen__valor">${r.pendientes}</p>
          <p class="tarjeta-resumen__mensaje">${r.pendientes ? '¡Tu puedes terminarlas!' : '¡Todo al día!'}</p>
        </a>
      </section>

      <section class="seccion seccion--progreso" aria-labelledby="t-progreso">
        <h2 class="titulo-seccion" id="t-progreso">Progreso</h2>
        ${progreso.length ? `<div class="progreso">${progreso.map((m) => `
          <div class="progreso__materia" title="${m.total ? `${m.porcentaje}% de las tareas hechas` : 'Sin tareas todavía'}">
            <span>${esc(m.nombre)}</span><span>${m.porcentaje}%</span>
            <div class="progreso__barra" role="progressbar" aria-valuenow="${m.porcentaje}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(m.nombre)}">
              <div class="progreso__relleno" data-valor="${m.porcentaje}"></div></div>
          </div>`).join('')}</div>`
        : '<p class="vacio">Agrega materias y tareas para ver tu progreso.</p>'}
      </section>

      <section class="seccion" aria-labelledby="t-metodos">
        <h2 class="titulo-seccion" id="t-metodos">Metodos de estudio</h2>
        <div class="metodos">
          <div class="metodo">
            <p class="metodo__nombre">Flashcards</p>
            <a class="pila" href="#/flashcards" aria-label="Abrir flashcards">
              <span class="pila__carta"></span><span class="pila__carta"></span>
              <span class="pila__carta"><span>Escribe una pregunta en un lado y la respuesta en la parte de atras</span><span>Toma una tarjeta y responde, ¡confirma tu respuesta mirando el reverso!</span></span>
            </a>
          </div>
          <div class="metodo">
            <p class="metodo__nombre">Pomodoro</p>
            ${UI.pomodoro()}
          </div>
        </div>
      </section>`,
      montar(raiz) {
        UI.activarPomodoro(raiz);
        // Las barras crecen al entrar
        requestAnimationFrame(() => requestAnimationFrame(() =>
          $$('[data-valor]', raiz).forEach((b) => (b.style.width = b.dataset.valor + '%'))));
      },
    };
  };

  // ------------------------------------------------------------ Calendario
  let seleccion = null;      // día elegido (ISO)
  let mesVisible = null;     // primer día del mes que se ve (ISO)

  V.calendario = () => {
    const { util } = Api;
    if (!seleccion) seleccion = util.hoy();
    if (!mesVisible) { const d = util.deISO(seleccion); mesVisible = util.fechaISO(new Date(d.getFullYear(), d.getMonth(), 1)); }
    const primero = util.deISO(mesVisible);
    const anio = primero.getFullYear(), mes = primero.getMonth();
    const diasMes = new Date(anio, mes + 1, 0).getDate();
    const vacios = util.indiceDia(primero);
    const conTareas = Api.tareas.fechasConTareas();
    const hoy = util.hoy();

    const celdas = [];
    for (let i = 0; i < vacios; i++) celdas.push('<span></span>');
    for (let d = 1; d <= diasMes; d++) {
      const iso = util.fechaISO(new Date(anio, mes, d));
      const clases = ['calendario__dia', iso === seleccion ? 'calendario__dia--sel' : '', iso === hoy ? 'calendario__dia--hoy' : '', conTareas.has(iso) ? 'calendario__dia--tarea' : ''].join(' ');
      celdas.push(`<button class="${clases}" data-dia="${iso}" aria-pressed="${iso === seleccion}" aria-label="${d} de ${UI.MESES[mes]}${conTareas.has(iso) ? ', con tareas' : ''}">${d}</button>`);
    }

    const sel = util.deISO(seleccion);
    const clases = Api.materias.clasesDelDia(seleccion);
    const tareas = Api.tareas.delDia(seleccion).filter((t) => !t.hecha);
    const nombreDia = `${util.DIAS[util.indiceDia(sel)].toLowerCase()} ${sel.getDate()} de ${UI.MESES[sel.getMonth()]}`;
    const mesTitulo = `${UI.MESES[mes][0].toUpperCase()}${UI.MESES[mes].slice(1)} ${anio}`;

    return {
      html: `
      <h1 class="titulo-pagina">Calendario</h1>
      <section class="seccion calendario" aria-label="Mes">
        <div class="calendario__mes">
          <button class="boton-icono" data-mes="-1" aria-label="Mes anterior">${Ic('atras')}</button>
          <span aria-live="polite">${mesTitulo}</span>
          <button class="boton-icono" data-mes="1" aria-label="Mes siguiente">${Ic('adelante')}</button>
        </div>
        <div class="calendario__rejilla">
          ${UI.DIAS_CORTOS.map((d) => `<span class="calendario__dia-semana">${d}</span>`).join('')}
          ${celdas.join('')}
        </div>
      </section>

      <section class="seccion" aria-labelledby="t-clases">
        <h2 class="subtitulo" id="t-clases">Clases</h2>
        ${clases.length ? `<div class="rejilla-2">${clases.map((c) => `
          <a class="item item--clase item--clic" href="#/materias/editar/${c.materiaId}">
            <p class="item__titulo">${esc(c.nombre)}<br>${c.salon ? (/^\d/.test(c.salon) ? 'Salón ' : '') + esc(c.salon) : 'Sin salón'}</p>
            <p class="item__detalle">${UI.hora12(c.inicio, true)} – ${UI.hora12(c.fin, true)}</p>
          </a>`).join('')}</div>`
        : `<p class="vacio">No tienes clases el ${esc(nombreDia)}.</p>`}
      </section>

      <section class="seccion" aria-labelledby="t-tareas">
        <h2 class="subtitulo" id="t-tareas">Tareas</h2>
        ${tareas.length ? `<div class="rejilla-2">${tareas.map((t) => `
          <div class="item item--clase">
            <p class="item__titulo">${esc(Api.materias.nombre(t.materiaId))}</p>
            <p class="item__detalle">${esc(t.titulo)}</p>
            <p class="item__detalle">Cierra: ${UI.hora12(t.hora)}</p>
            <button class="check-tarea check-tarea--grande item__lateral" data-hecha="${t.id}" aria-label="Marcar “${esc(t.titulo)}” como hecha">${Ic('check')}</button>
          </div>`).join('')}</div>`
        : `<p class="vacio">No hay tareas pendientes para el ${esc(nombreDia)}.</p>`}
        <a class="btn btn--rojo" href="#/tareas" style="font-family:var(--font-titulo)">Ver tareas</a>
      </section>`,
      montar(raiz) {
        $$('[data-dia]', raiz).forEach((b) => (b.onclick = () => { seleccion = b.dataset.dia; global.App.refrescar(); }));
        $$('[data-mes]', raiz).forEach((b) => (b.onclick = () => {
          mesVisible = util.fechaISO(new Date(anio, mes + Number(b.dataset.mes), 1));
          global.App.refrescar();
        }));
        $$('[data-hecha]', raiz).forEach((b) => (b.onclick = () => {
          const r = Api.tareas.alternar(b.dataset.hecha);
          if (!r.ok) return UI.aviso(r.error);
          global.App.refrescar(`¡Terminaste ${r.valor.titulo}!`);
        }));
      },
    };
  };
  V.calendario.reiniciar = () => { seleccion = null; mesVisible = null; };
})(window);
