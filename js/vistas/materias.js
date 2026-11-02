/* Materias (lista, crear, editar, eliminar) y Simulador de notas */
(function (global) {
  'use strict';
  const { Api, UI, Ic } = global;
  const { $, $$, esc, campo } = UI;
  const V = global.Vistas = global.Vistas || {};

  const salonTexto = (s) => (s ? (/^\d/.test(s) ? `Salón ${s}` : s) : '');
  const lineaHorario = (h) => `${h.dia} ${UI.hora12Corta(h.inicio)} - ${UI.hora12Corta(h.fin)}${h.salon ? ` • ${salonTexto(h.salon)}` : ''}`;

  // ---------------------------------------------------------- Mis materias
  V.materias = () => {
    const ms = Api.materias.listar();
    return {
      html: `
      <h1 class="titulo-pagina">Mis materias</h1>
      <section class="seccion">
        <p class="instruccion">Selecciona una materia para simular la calificación que necesitas para pasar:</p>
        ${ms.length ? `<div class="rejilla-2">${ms.map((m) => `
          <div class="item item--clic" data-ir="/simulador/${m.id}" tabindex="0" role="link" aria-label="Simular notas de ${esc(m.nombre)}">
            <div class="item__contenido">
              <p class="item__titulo">${esc(m.nombre)}</p>
              ${m.horarios.map((h) => `<p class="item__detalle">${esc(lineaHorario(h))}</p>`).join('')}
            </div>
            <div class="item__acciones">
              <a class="boton-icono accion-editar" href="#/materias/editar/${m.id}" aria-label="Editar ${esc(m.nombre)}">${Ic('editar')}</a>
              <button class="boton-icono accion-eliminar" data-eliminar="${m.id}" aria-label="Eliminar ${esc(m.nombre)}">${Ic('eliminar')}</button>
            </div>
          </div>`).join('')}</div>`
        : '<p class="vacio">Aún no tienes materias. Crea la primera para organizar tu horario.</p>'}
        <a class="btn btn--rojo btn--ancho" href="#/materias/nueva">Crear materia</a>
      </section>`,
      montar(raiz) {
        $$('[data-ir]', raiz).forEach((el) => {
          el.addEventListener('click', (e) => { if (!e.target.closest('a, button')) global.App.ir(el.dataset.ir); });
          el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === el) global.App.ir(el.dataset.ir); });
        });
        $$('[data-eliminar]', raiz).forEach((b) => (b.onclick = () => {
          const m = Api.materias.obtener(b.dataset.eliminar);
          UI.confirmar({
            titulo: '¿Eliminar esta materia?', detalle: m.nombre,
            texto: 'También se borrarán sus flashcards y notas. Sus tareas quedarán sin materia.',
            alAceptar: () => {
              const r = Api.materias.eliminar(m.id);
              global.App.refrescar(r.ok ? `Se eliminó ${m.nombre} correctamente.` : r.error);
            },
          });
        }));
      },
    };
  };

  // ----------------------------------------------- Crear / editar materia
  function bloqueHorario(h, n) {
    return `<div class="horario" data-horario="${esc(h.id || '')}">
      <div class="horario__cabeza"><span data-num>Horario ${n}</span>
        <button type="button" class="boton-icono accion-eliminar" data-quitar aria-label="Quitar horario" style="width:30px;height:30px">${Ic('eliminar')}</button></div>
      ${campo('Salón:', `<input class="input" data-salon value="${esc(h.salon)}" placeholder="304">`)}
      ${campo('Dia:', `<select class="select" data-dia>${Api.util.DIAS.map((d) => `<option ${d === h.dia ? 'selected' : ''}>${d}</option>`).join('')}</select>`)}
      <div class="campo"><span class="campo__label">Hora:</span>
        <div class="fila-hora">${UI.selectorHora('inicio', h.inicio)}<span class="fila-hora__a">a</span>${UI.selectorHora('fin', h.fin)}</div></div>
    </div>`;
  }

  function formularioMateria(m) {
    const nueva = !m;
    m = m || { nombre: '', profesor: '', horarios: [{ dia: 'Lunes', inicio: '08:00', fin: '10:00', salon: '' }] };
    return {
      html: `
      <div class="titulo-con-atras">
        <a class="boton-icono" href="#/materias" aria-label="Volver a materias">${Ic('atras')}</a>
        <h1 class="titulo-pagina">${nueva ? 'Crear nueva materia' : 'Editar materia'}</h1>
      </div>
      <form class="seccion" novalidate>
        ${campo('Nombre de la materia:', `<input class="input" id="nombre" value="${esc(m.nombre)}" placeholder="Nombre materia" maxlength="80">`, 'nombre')}
        <hr class="separador">
        ${campo('Profesor:', `<input class="input" id="profesor" value="${esc(m.profesor)}" placeholder="Nombre profesor" maxlength="80">`, 'profesor')}
        <hr class="separador">
        <div id="horarios" style="display:flex;flex-direction:column;gap:var(--gap);width:100%">${m.horarios.map((h, i) => bloqueHorario(h, i + 1)).join('')}</div>
        <p class="error" data-error></p>
        <div class="fila-botones">
          <button type="button" class="btn btn--rojo btn--medio" data-agregar>+ Horario</button>
          <button type="submit" class="btn btn--rojo btn--medio">Guardar</button>
          <a class="btn btn--rojo btn--medio" href="#/materias">Cancelar</a>
        </div>
      </form>`,
      montar(raiz) {
        const caja = $('#horarios', raiz);
        const ordenar = () => {
          const bloques = $$('[data-horario]', caja);
          bloques.forEach((b, i) => { $('[data-num]', b).textContent = `Horario ${i + 1}`; $('[data-quitar]', b).hidden = bloques.length === 1; });
        };
        const enlazar = () => $$('[data-quitar]', caja).forEach((b) => (b.onclick = () => { b.closest('[data-horario]').remove(); ordenar(); }));
        enlazar(); ordenar();
        $('[data-agregar]', raiz).onclick = () => {
          const n = $$('[data-horario]', caja).length;
          const ult = $$('[data-horario]', caja).pop();
          const sigDia = ult ? Api.util.DIAS[(Api.util.DIAS.indexOf($('[data-dia]', ult).value) + 2) % 7] : 'Lunes';
          caja.insertAdjacentHTML('beforeend', bloqueHorario({ dia: sigDia, inicio: '08:00', fin: '10:00', salon: '' }, n + 1));
          enlazar(); ordenar();
          caja.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        $('form', raiz).onsubmit = (e) => {
          e.preventDefault();
          const horarios = $$('[data-horario]', caja).map((b) => ({
            id: b.dataset.horario || undefined,
            salon: $('[data-salon]', b).value,
            dia: $('[data-dia]', b).value,
            inicio: UI.leerHora(b, 'inicio'),
            fin: UI.leerHora(b, 'fin'),
          }));
          const r = Api.materias.guardar({ id: m.id, nombre: $('#nombre', raiz).value, profesor: $('#profesor', raiz).value, horarios });
          if (!r.ok) { $('[data-error]', raiz).textContent = r.error; return; }
          global.App.ir('/materias', nueva ? `Se creó ${r.valor.nombre} correctamente.` : `Se actualizó ${r.valor.nombre} correctamente.`);
        };
      },
    };
  }
  V['materias/nueva'] = () => formularioMateria(null);
  V['materias/editar'] = (id) => { const m = Api.materias.obtener(id); return m ? formularioMateria(m) : V.materias(); };

  // ----------------------------------------------------- Simulador de notas
  V.simulador = () => {
    const ms = Api.materias.listar();
    return {
      html: `
      <h1 class="titulo-pagina">Simulador de notas</h1>
      <section class="seccion">
        <p class="instruccion">Selecciona una materia para simular la calificación que necesitas para pasar:</p>
        ${ms.length ? `<div class="rejilla-2">${ms.map((m) => {
          const p = Api.notas.promedioMateria(m.id);
          return `<a class="item item--clic" href="#/simulador/${m.id}">
            <div class="item__contenido"><p class="item__titulo">${esc(m.nombre)}</p>
            <p class="item__detalle">${p === null ? 'Sin notas registradas' : `Promedio actual: ${p.toFixed(1)}`}</p></div>
            <span class="boton-icono" style="width:30px;height:30px">${Ic('adelante')}</span></a>`;
        }).join('')}</div>`
        : '<p class="vacio">Primero agrega una materia.</p>'}
        ${ms.length ? '' : '<a class="btn btn--rojo btn--ancho" href="#/materias/nueva">Crear materia</a>'}
      </section>`,
    };
  };

  V['simulador/materia'] = (id) => {
    const m = Api.materias.obtener(id);
    if (!m) return V.simulador();
    const estado = Api.notas.deMateria(id);
    const filas = () => estado.pesos.map((p, i) => `
      <div class="simulador__fila">
        <span>Periodo ${i + 1}</span>
        <span class="simulador__celda"><input inputmode="decimal" data-nota="${i}" value="${esc(estado.notas[i])}" placeholder="--" aria-label="Nota del periodo ${i + 1}" maxlength="4"></span>
        <span class="simulador__celda"><input inputmode="decimal" data-peso="${i}" value="${esc(p)}%" aria-label="Porcentaje del periodo ${i + 1}" maxlength="6"></span>
      </div>`).join('');
    return {
      html: `
      <div class="titulo-con-atras">
        <a class="boton-icono" href="#/simulador" aria-label="Volver">${Ic('atras')}</a>
        <h1 class="titulo-pagina">Simulador de notas - ${esc(m.nombre)}</h1>
      </div>
      <section class="seccion">
        <p class="instruccion">Escribe tu nota y el porcentaje de la nota en los siguientes espacios:</p>
        <div class="simulador">
          <div class="simulador__encabezado">
            ${Ic('calendario')}
            <label class="simulador__periodos"><span class="sr">Número de periodos</span>
              <select id="periodos">${[1, 2, 3, 4, 5, 6].map((k) => `<option value="${k}" ${k === estado.periodos ? 'selected' : ''}>Períodos: ${k}</option>`).join('')}</select></label>
            <span title="Nota (0,0 a 5,0)" style="justify-self:center;width:44px;height:44px">${Ic('nota')}</span>
            <span title="Porcentaje" style="justify-self:center;width:36px;height:36px">${Ic('porcentaje')}</span>
          </div>
          <div id="filas" style="display:flex;flex-direction:column;gap:var(--gap-s)">${filas()}</div>
          <p class="simulador__total" id="total"></p>
        </div>
        <button class="btn btn--rojo btn--ancho" id="calcular">Calcular</button>
        <div class="resultado" id="resultado" hidden aria-live="polite"></div>
      </section>`,
      montar(raiz) {
        const total = () => estado.pesos.reduce((a, b) => a + (Number(b) || 0), 0);
        const mostrarTotal = () => {
          const t = +total().toFixed(1), el = $('#total', raiz);
          el.textContent = t === 100 ? 'Los porcentajes suman 100%' : `Los porcentajes suman ${t}% (deben sumar 100%)`;
          el.classList.toggle('mal', t !== 100);
        };
        const guardar = () => Api.notas.guardar(id, estado);
        const enlazar = () => {
          $$('[data-nota]', raiz).forEach((inp) => {
            inp.oninput = () => { estado.notas[+inp.dataset.nota] = inp.value.trim(); guardar(); $('#resultado', raiz).hidden = true; };
          });
          $$('[data-peso]', raiz).forEach((inp) => {
            inp.onfocus = () => { inp.value = inp.value.replace('%', ''); };
            inp.oninput = () => { estado.pesos[+inp.dataset.peso] = Api.util.aNumero(inp.value) || 0; guardar(); mostrarTotal(); $('#resultado', raiz).hidden = true; };
            inp.onblur = () => { inp.value = `${estado.pesos[+inp.dataset.peso]}%`; };
          });
        };
        enlazar(); mostrarTotal();
        $('#periodos', raiz).onchange = (e) => {
          const n = Number(e.target.value);
          estado.periodos = n;
          estado.pesos = Api.notas.pesosPorDefecto(n);
          estado.notas = Array.from({ length: n }, (_, i) => estado.notas[i] || '');
          guardar();
          $('#filas', raiz).innerHTML = filas();
          enlazar(); mostrarTotal();
          $('#resultado', raiz).hidden = true;
        };
        $('#calcular', raiz).onclick = () => {
          const r = Api.notas.calcular(estado);
          const caja = $('#resultado', raiz);
          caja.hidden = false;
          if (!r.ok) { caja.innerHTML = `<p class="error">${esc(r.error)}</p>`; return; }
          const v = r.valor;
          caja.innerHTML = v.tipo === 'final'
            ? `<p>Tu nota definitiva es</p><p class="resultado__numero">${v.definitiva.toFixed(1)}</p><p>${esc(v.mensaje)}</p>`
            : `<p>Necesitas sacar en lo que falta (${v.restante}% de la materia):</p><p class="resultado__numero">${v.necesaria > 5 ? '> 5.0' : v.necesaria.toFixed(1)}</p><p>${esc(v.mensaje)}</p>`;
          caja.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
      },
    };
  };
})(window);
