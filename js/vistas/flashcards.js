/* Flashcards: repaso por materia, mazos, crear, editar y eliminar */
(function (global) {
  'use strict';
  const { Api, UI, Ic } = global;
  const { $, $$, esc, campo } = UI;
  const V = global.Vistas = global.Vistas || {};

  let materiaRepaso = null; // materia elegida en "Selecciona la materia"
  let inicioRepaso = 0;     // primera tarjeta visible del carrusel

  const tarjeta = (f) => `<div class="flashcard" data-voltear tabindex="0" role="button" aria-label="Flashcard: ${esc(f.pregunta)}. Toca para ver la respuesta.">
      <div class="flashcard__interior">
        <div class="flashcard__cara flashcard__cara--frente"><small>Pregunta</small>${esc(f.pregunta)}</div>
        <div class="flashcard__cara flashcard__cara--reverso"><small>Respuesta</small>${esc(f.respuesta)}</div>
      </div></div>`;
  const tarjetaVacia = (texto) => `<div class="flashcard flashcard--vacia"><div class="flashcard__interior"><div class="flashcard__cara flashcard__cara--frente">${texto}</div></div></div>`;

  function activarVolteo(raiz) {
    $$('[data-voltear]', raiz).forEach((c) => {
      const voltear = () => c.classList.toggle('volteada');
      c.addEventListener('click', voltear);
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); } });
    });
  }

  // Overlay_NuevaFlashcard (y edición)
  function formularioFlashcard({ f, materiaId, alGuardar }) {
    if (!Api.materias.listar().length) { global.App.ir('/materias/nueva', 'Primero crea una materia para tus flashcards.'); return; }
    UI.ventanaFormulario({
      titulo: f ? 'Editar flashcard' : 'Nueva Flashcard',
      cuerpo: `
        ${campo('Materia:', `<select class="select" id="fc-materia" required>${UI.opcionesMaterias(f ? f.materiaId : materiaId)}</select>`, 'fc-materia')}
        ${campo('Pregunta (frente):', `<textarea class="textarea" id="fc-pregunta" placeholder="¿Cual es la pregunta?" maxlength="300">${esc(f ? f.pregunta : '')}</textarea>`, 'fc-pregunta')}
        ${campo('Respuesta (reverso):', `<textarea class="textarea" id="fc-respuesta" placeholder="Respuesta" maxlength="500" style="background:var(--salvia);border-color:var(--salvia-borde)">${esc(f ? f.respuesta : '')}</textarea>`, 'fc-respuesta')}`,
      alGuardar: (form) => {
        const r = Api.flashcards.guardar({ id: f && f.id, materiaId: $('#fc-materia', form).value, pregunta: $('#fc-pregunta', form).value, respuesta: $('#fc-respuesta', form).value });
        if (r.ok) setTimeout(() => alGuardar(r.valor));
        return r;
      },
    });
  }

  // -------------------------------------------------------- Flashcard (repaso)
  V.flashcards = () => {
    const ms = Api.materias.listar();
    if (materiaRepaso && !ms.some((m) => m.id === materiaRepaso)) materiaRepaso = null;
    const mazos = Api.flashcards.materiasConTarjetas();
    if (!materiaRepaso && mazos.length) materiaRepaso = mazos[0].id;
    const cartas = materiaRepaso ? Api.flashcards.listar(materiaRepaso) : [];
    if (inicioRepaso >= cartas.length) inicioRepaso = 0;
    const visibles = cartas.slice(inicioRepaso, inicioRepaso + 3);
    const relleno = Array.from({ length: Math.max(0, 3 - visibles.length) }, (_, i) =>
      tarjetaVacia(i === 0 && !cartas.length ? (materiaRepaso ? 'Esta materia aún no tiene flashcards' : 'Crea tu primera flashcard') : '¿Cual es la pregunta?'));

    return {
      html: `
      <h1 class="titulo-pagina">FlashCard</h1>
      <section class="seccion">
        <div class="flashcards-vista">
          ${cartas.length > 3 ? `<button class="boton-icono" data-mover="-3" aria-label="Tarjetas anteriores" ${inicioRepaso === 0 ? 'disabled style="opacity:.3"' : ''}>${Ic('atras')}</button>` : ''}
          <div class="flashcards-vista__tarjetas">${visibles.map(tarjeta).join('')}${relleno.join('')}</div>
          ${cartas.length > 3 ? `<button class="boton-icono" data-mover="3" aria-label="Tarjetas siguientes" ${inicioRepaso + 3 >= cartas.length ? 'disabled style="opacity:.3"' : ''}>${Ic('adelante')}</button>` : ''}
        </div>
        ${cartas.length ? `<p class="lateral__texto centro">Toca una tarjeta para ver la respuesta · ${inicioRepaso + 1}–${Math.min(inicioRepaso + 3, cartas.length)} de ${cartas.length}</p>` : ''}
        ${UI.desplegable({ id: 'materia-repaso', texto: 'Selecciona la materia', seleccion: materiaRepaso, opciones: ms.map((m) => ({ valor: m.id, texto: m.nombre })) })}

        <div class="titulo-con-boton">
          <h2 class="titulo-con-boton__texto">Flashcard Creada</h2>
          <button class="btn btn--rojo" data-nueva>+&nbsp;&nbsp;&nbsp;Nueva Flashcard</button>
        </div>
        ${mazos.length ? `<div class="rejilla-2 lista-mazos">${mazos.map((m) => `
          <a class="btn btn--contorno" href="#/flashcards/${m.id}"><span>${esc(m.nombre)}</span><small>${m.total} ${m.total === 1 ? 'tarjeta' : 'tarjetas'}</small></a>`).join('')}</div>`
        : '<p class="vacio">Aún no has creado flashcards.</p>'}
      </section>`,
      montar(raiz) {
        activarVolteo(raiz);
        UI.activarDesplegable($('#materia-repaso', raiz), (id) => { materiaRepaso = id; inicioRepaso = 0; global.App.refrescar(); });
        $$('[data-mover]', raiz).forEach((b) => (b.onclick = () => { inicioRepaso = Math.max(0, inicioRepaso + Number(b.dataset.mover)); global.App.refrescar(); }));
        $('[data-nueva]', raiz).onclick = () => formularioFlashcard({
          materiaId: materiaRepaso,
          alGuardar: (f) => { materiaRepaso = f.materiaId; global.App.refrescar('Se creó la flashcard correctamente.'); },
        });
      },
    };
  };

  // ------------------------------------------- Flashcard_Lista (una materia)
  V['flashcards/materia'] = (id) => {
    const m = Api.materias.obtener(id);
    if (!m) return V.flashcards();
    const cartas = Api.flashcards.listar(id);
    return {
      html: `
      <div class="titulo-con-atras">
        <a class="boton-icono" href="#/flashcards" aria-label="Volver">${Ic('atras')}</a>
        <h1 class="titulo-pagina">${esc(m.nombre)}</h1>
      </div>
      <section class="seccion">
        <div class="titulo-con-boton">
          <h2 class="etiqueta-grupo" style="width:auto">Flashcards (${cartas.length})</h2>
          <button class="btn btn--rojo" data-nueva>+&nbsp;&nbsp;&nbsp;Nueva Flashcard</button>
        </div>
        ${cartas.length ? `<div class="rejilla-tarjetas">${cartas.map((f) => `
          <div class="flashcard-item">${tarjeta(f)}
            <div class="flashcard-item__acciones">
              <button class="boton-icono accion-editar" data-editar="${f.id}" aria-label="Editar flashcard">${Ic('editar')}</button>
              <button class="boton-icono accion-eliminar" data-eliminar="${f.id}" aria-label="Eliminar flashcard">${Ic('eliminar')}</button>
            </div></div>`).join('')}</div>`
        : '<p class="vacio">Esta materia aún no tiene flashcards.</p>'}
        <button class="btn btn--rojo btn--ancho" data-repasar ${cartas.length ? '' : 'hidden'}>Repasar</button>
      </section>`,
      montar(raiz) {
        activarVolteo(raiz);
        $('[data-nueva]', raiz).onclick = () => formularioFlashcard({ materiaId: id, alGuardar: () => global.App.refrescar('Se creó la flashcard correctamente.') });
        $('[data-repasar]', raiz).onclick = () => { materiaRepaso = id; inicioRepaso = 0; global.App.ir('/flashcards'); };
        $$('[data-editar]', raiz).forEach((b) => (b.onclick = () => formularioFlashcard({
          f: Api.flashcards.obtener(b.dataset.editar),
          alGuardar: () => global.App.refrescar('Se actualizó la flashcard correctamente.'),
        })));
        $$('[data-eliminar]', raiz).forEach((b) => (b.onclick = () => {
          const f = Api.flashcards.obtener(b.dataset.eliminar);
          UI.confirmar({
            titulo: '¿Eliminar esta flashcard?', detalle: f.pregunta,
            alAceptar: () => { const r = Api.flashcards.eliminar(f.id); global.App.refrescar(r.ok ? 'Se eliminó la flashcard correctamente.' : r.error); },
          });
        }));
      },
    };
  };
})(window);
