/* Tareas: lista, crear (ventana), editar (pantalla), marcar y eliminar */
(function (global) {
  'use strict';
  const { Api, UI, Ic } = global;
  const { $, $$, esc, campo } = UI;
  const V = global.Vistas = global.Vistas || {};

  const camposTarea = (t) => `
    ${campo('Título:', `<input class="input" id="titulo" value="${esc(t.titulo)}" placeholder="Ej: Taller de Cálculo II" maxlength="120">`, 'titulo')}
    ${campo('Nombre de la materia:', `<select class="select" id="materia" required>${UI.opcionesMaterias(t.materiaId)}</select>`, 'materia')}
    <div class="rejilla-2" style="gap:var(--gap)">
      ${campo('Fecha de entrega:', `<input class="input" id="fecha" type="date" value="${esc(t.fecha)}">`, 'fecha')}
      <div class="campo"><span class="campo__label">Hora de cierre:</span>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:var(--gap)">${UI.selectorHora('cierre', t.hora || '23:59')}</div></div>
    </div>
    ${campo('Descripción (opcional):', `<textarea class="textarea" id="descripcion" placeholder="Agrega detalles de la tarea" maxlength="500">${esc(t.descripcion)}</textarea>`, 'descripcion')}`;

  const leerTarea = (raiz, id) => ({
    id,
    titulo: $('#titulo', raiz).value,
    materiaId: $('#materia', raiz).value,
    fecha: $('#fecha', raiz).value,
    hora: UI.leerHora(raiz, 'cierre'),
    descripcion: $('#descripcion', raiz).value,
  });

  // Overlay_CrearTarea
  function nuevaTarea(fecha) {
    if (!Api.materias.listar().length) { global.App.ir('/materias/nueva', 'Primero crea una materia para tus tareas.'); return; }
    UI.ventanaFormulario({
      titulo: 'Nueva tarea',
      cuerpo: camposTarea({ titulo: '', materiaId: '', fecha: fecha || Api.util.hoy(), hora: '23:59', descripcion: '' }),
      alGuardar: (form) => {
        const r = Api.tareas.guardar(leerTarea(form));
        if (r.ok) setTimeout(() => global.App.refrescar(`Se creó “${r.valor.titulo}” correctamente.`));
        return r;
      },
    });
  }

  V.tareas = () => {
    const pend = Api.tareas.pendientes(), hechas = Api.tareas.hechas();
    const fila = (t) => `<div class="item ${t.hecha ? 'item--hecho' : ''}">
        <button class="check-tarea" role="checkbox" aria-checked="${t.hecha}" data-alternar="${t.id}" aria-label="${t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}: ${esc(t.titulo)}">${Ic('check')}</button>
        <div class="item__contenido">
          <p class="item__titulo">${esc(t.titulo)}</p>
          <p class="item__detalle">${esc(Api.materias.nombre(t.materiaId))} · ${UI.etiquetaFecha(t.fecha)}</p>
        </div>
        <div class="item__acciones">
          <a class="boton-icono accion-editar" href="#/tareas/editar/${t.id}" aria-label="Editar ${esc(t.titulo)}">${Ic('editar')}</a>
          <button class="boton-icono accion-eliminar" data-eliminar="${t.id}" aria-label="Eliminar ${esc(t.titulo)}">${Ic('eliminar')}</button>
        </div></div>`;
    return {
      html: `
      <h1 class="titulo-pagina">Tareas</h1>
      <section class="seccion">
        <h2 class="etiqueta-grupo">Pendientes (${pend.length})</h2>
        ${pend.length ? `<div class="rejilla-2">${pend.map(fila).join('')}</div>` : '<p class="vacio">No tienes tareas pendientes. ¡Bien hecho!</p>'}
      </section>
      <section class="seccion">
        <h2 class="etiqueta-grupo">Hechas (${hechas.length})</h2>
        ${hechas.length ? `<div class="rejilla-2">${hechas.map(fila).join('')}</div>` : '<p class="vacio">Aquí verás las tareas que completes.</p>'}
      </section>
      <div style="height:70px"></div>
      <button class="btn btn--rojo flotante" data-nueva>+ Nueva Tarea</button>`,
      montar(raiz) {
        $('[data-nueva]', raiz).onclick = () => nuevaTarea();
        $$('[data-alternar]', raiz).forEach((b) => (b.onclick = () => {
          const r = Api.tareas.alternar(b.dataset.alternar);
          if (!r.ok) return UI.aviso(r.error);
          global.App.refrescar(r.valor.hecha ? `¡Terminaste “${r.valor.titulo}”!` : 'Tarea marcada como pendiente.');
        }));
        $$('[data-eliminar]', raiz).forEach((b) => (b.onclick = () => {
          const t = Api.tareas.obtener(b.dataset.eliminar);
          UI.confirmar({
            titulo: '¿Eliminar esta tarea?', detalle: t.titulo,
            alAceptar: () => {
              const r = Api.tareas.eliminar(t.id);
              global.App.refrescar(r.ok ? `Se eliminó “${t.titulo}” correctamente.` : r.error);
            },
          });
        }));
      },
    };
  };

  // Tareas_Editar
  V['tareas/editar'] = (id) => {
    const t = Api.tareas.obtener(id);
    if (!t) return V.tareas();
    return {
      html: `
      <div class="titulo-con-atras">
        <a class="boton-icono" href="#/tareas" aria-label="Volver a tareas">${Ic('atras')}</a>
        <h1 class="titulo-pagina">Editar tarea</h1>
      </div>
      <form class="seccion" novalidate>
        ${camposTarea(t)}
        <label class="check" style="font-size:var(--fs-20)"><input type="checkbox" id="hecha" ${t.hecha ? 'checked' : ''}><span>Ya la terminé</span></label>
        <hr class="separador">
        <p class="error" data-error></p>
        <div class="fila-botones">
          <a class="btn btn--rojo btn--medio" href="#/tareas">Cancelar</a>
          <button class="btn btn--rojo btn--medio" type="submit">Guardar</button>
        </div>
      </form>`,
      montar(raiz) {
        $('form', raiz).onsubmit = (e) => {
          e.preventDefault();
          const r = Api.tareas.guardar(leerTarea(raiz, id));
          if (!r.ok) { $('[data-error]', raiz).textContent = r.error; return; }
          if ($('#hecha', raiz).checked !== r.valor.hecha) Api.tareas.alternar(id);
          global.App.ir('/tareas', `Se editó “${r.valor.titulo}” correctamente.`);
        };
      },
    };
  };

  global.Tareas = { nueva: nuevaTarea };
})(window);
