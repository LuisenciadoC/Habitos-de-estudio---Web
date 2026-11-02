/* =====================================================================
   Hábitos de Estudio · Backend local
   api.js — Reglas de negocio de la aplicación.

   Funciona como el "servidor" de la app, pero corre dentro del navegador
   y guarda todo en localStorage a través de Almacen. La interfaz nunca
   toca los datos directamente: siempre llama a estas funciones.

   Cada operación que puede fallar devuelve { ok: true, valor } o
   { ok: false, error: 'mensaje para mostrar' }.
   ===================================================================== */
(function (global) {
  'use strict';

  const A = global.Almacen;

  // ---------------------------------------------------------------- utilidades
  const ok = (valor) => ({ ok: true, valor });
  const falla = (error) => ({ ok: false, error });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const limpio = (s) => String(s == null ? '' : s).trim();
  const copia = (o) => JSON.parse(JSON.stringify(o));

  const pad = (n) => String(n).padStart(2, '0');
  const fechaISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const hoy = () => fechaISO(new Date());
  const sumarDias = (iso, n) => { const d = deISO(iso); d.setDate(d.getDate() + n); return fechaISO(d); };
  const indiceDia = (d) => (d.getDay() + 6) % 7; // 0 = lunes

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const NOTA_MIN = 0, NOTA_MAX = 5, NOTA_APROBAR = 3;

  // Huella de la contraseña (no se guarda en texto plano).
  // Nota: sin servidor no existe seguridad real; esto solo evita que se lea a simple vista.
  function huella(texto, sal) {
    const s = `${sal}:${texto}`;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }
  const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
  const horaValida = (h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
  const aNumero = (v) => {
    const x = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return Number.isFinite(x) ? x : null;
  };

  // ----------------------------------------------------------------- sesión
  const db = () => A.leer();
  const usuarioActual = () => { const d = db(); return (d.sesion && d.usuarios[d.sesion]) || null; };
  const datos = () => { const u = usuarioActual(); if (!u) throw new Error('No hay sesión iniciada'); return u.datos; };
  const persistir = () => (A.guardar() ? ok(true) : falla('No se pudo guardar: el almacenamiento del navegador está lleno.'));

  function datosVacios() {
    return { materias: [], tareas: [], flashcards: [], notas: {}, racha: { dias: 0, ultimo: null } };
  }

  // Registra el día de hoy en la racha de estudio.
  function marcarRacha() {
    const u = usuarioActual(); if (!u) return;
    const r = u.datos.racha;
    const h = hoy();
    if (r.ultimo === h) return;
    r.dias = r.ultimo === sumarDias(h, -1) ? r.dias + 1 : 1;
    r.ultimo = h;
    A.guardar();
  }

  function rachaVigente() {
    const u = usuarioActual(); if (!u) return { dias: 0, activa: false };
    const r = u.datos.racha;
    const h = hoy();
    const viva = r.ultimo === h || r.ultimo === sumarDias(h, -1);
    return { dias: viva ? r.dias : 0, activa: r.ultimo === h };
  }

  // ------------------------------------------------------------ datos demo
  function datosDemo() {
    const h = hoy();
    const ids = {};
    const m = (clave, nombre, profesor, horarios) => {
      ids[clave] = uid();
      return { id: ids[clave], nombre, profesor, horarios: horarios.map(([dia, inicio, fin, salon]) => ({ id: uid(), dia, inicio, fin, salon })) };
    };
    const materias = [
      m('esp', 'Matemáticas Especiales', 'Ana Gómez', [['Lunes', '08:00', '10:00', '304'], ['Miércoles', '20:00', '22:00', '705']]),
      m('fin', 'Matemáticas Financieras', 'Jorge Pardo', [['Martes', '19:00', '21:00', '201'], ['Miércoles', '18:00', '20:00', '510']]),
      m('arq', 'Arquitectura de Software', 'Lucía Méndez', [['Lunes', '06:00', '08:00', '809'], ['Sábado', '06:00', '08:00', '1205']]),
      m('tic', 'Desarrollo de Industrias TIC', '', [['Martes', '05:00', '07:00', '108'], ['Jueves', '20:00', '22:00', '403']]),
      m('inn', 'Innovación Tecnológica', '', [['Viernes', '10:00', '12:00', '606'], ['Sábado', '20:00', '22:00', '502']]),
      m('seg', 'Seguridad Informática', '', [['Jueves', '08:00', '10:00', '901'], ['Viernes', '20:00', '22:00', '1105']]),
      m('jav', 'Programación Java', '', [['Domingo', '12:00', '15:00', 'Casa']]),
    ];
    const t = (titulo, mat, dias, hora, hecha, descripcion) =>
      ({ id: uid(), titulo, materiaId: ids[mat], fecha: sumarDias(h, dias), hora, descripcion: descripcion || '', hecha: !!hecha });
    const tareas = [
      t('Taller de Cauchy Riemann', 'esp', 0, '20:00'),
      t('Preparar exposición', 'jav', 0, '23:59'),
      t('Taller de Valor futuro con anualidad vencida', 'fin', 1, '11:00'),
      t('Proyecto', 'inn', 3, '23:00', false, 'Entrega del prototipo y la presentación.'),
      t('Leer capítulo 4', 'arq', 5, '18:00'),
      t('Quiz de Programación', 'jav', -3, '10:00', true),
      t('Informe de riesgos', 'seg', -1, '22:00', true),
      t('Taller de series de Fourier', 'esp', -6, '20:00', true),
      t('Ejercicios de interés compuesto', 'fin', -5, '18:00', true),
      t('Diagrama de componentes', 'arq', -4, '23:00', true),
      t('Caso de estudio: modelo de negocio', 'tic', -2, '21:00', true),
      t('Lluvia de ideas del reto', 'inn', -2, '12:00', true),
      t('Mapa de procesos del sector', 'tic', 6, '20:00'),
    ];
    const f = (mat, pregunta, respuesta) => ({ id: uid(), materiaId: ids[mat], pregunta, respuesta });
    const flashcards = [
      f('fin', '¿Qué estudian las matemáticas financieras?', 'El valor del dinero en el tiempo: intereses, inversiones, créditos y anualidades.'),
      f('fin', '¿Cuál es el principio fundamental de las finanzas?', 'Un peso hoy vale más que un peso mañana, por su capacidad de generar rendimientos.'),
      f('fin', '¿Cuáles son los elementos básicos de una operación financiera?', 'Capital, tasa de interés, tiempo y monto (valor futuro).'),
      f('fin', '¿Qué es una anualidad vencida?', 'Una serie de pagos iguales que se hacen al final de cada periodo.'),
      f('esp', '¿Qué dicen las ecuaciones de Cauchy-Riemann?', 'Son la condición para que una función compleja sea derivable: uₓ = v_y y u_y = −vₓ.'),
      f('jav', '¿Qué es una clase en Java?', 'Una plantilla que define los atributos y métodos de los objetos.'),
      f('inn', '¿Qué es un prototipo?', 'Una versión temprana de un producto para probar la idea con usuarios.'),
    ];
    const notas = {
      [ids.esp]: { periodos: 3, pesos: [30, 30, 40], notas: ['3.0', '5.0', ''] },
      [ids.fin]: { periodos: 3, pesos: [30, 30, 40], notas: ['2.8', '3.4', ''] },
      [ids.arq]: { periodos: 3, pesos: [30, 30, 40], notas: ['4.2', '4.5', ''] },
    };
    return { materias, tareas, flashcards, notas, racha: { dias: 14, ultimo: sumarDias(h, -1) } };
  }

  // Cuentas de prueba para "Continuar con Google" (sin servidor no se pueden validar cuentas reales).
  const CUENTAS_GOOGLE = [
    { nombre: 'Camila Torres', correo: 'camila.torres@correo.com' },
    { nombre: 'Andrés Rojas', correo: 'andres.rojas@correo.com' },
    { nombre: 'Laura Gómez', correo: 'laura.gomez@correo.com' },
    { nombre: 'Mateo Herrera', correo: 'mateo.herrera@correo.com' },
    { nombre: 'Valentina Ríos', correo: 'valentina.rios@correo.com' },
  ];

  // ================================================================== AUTH
  const auth = {
    sesion: () => (usuarioActual() ? publico(usuarioActual()) : null),

    registrar({ nombre, correo, clave, confirmar, acepta }) {
      nombre = limpio(nombre); correo = limpio(correo).toLowerCase();
      if (!nombre) return falla('Escribe tu nombre.');
      if (!correoValido(correo)) return falla('Escribe un correo válido.');
      if (db().usuarios[correo]) return falla('Ya existe una cuenta con ese correo.');
      if (String(clave || '').length < 8) return falla('La contraseña debe tener mínimo 8 caracteres.');
      if (clave !== confirmar) return falla('Las contraseñas no coinciden.');
      if (!acepta) return falla('Debes aceptar los Términos de servicio y la Política de privacidad.');
      const sal = uid();
      db().usuarios[correo] = { nombre, correo, sal, clave: huella(clave, sal), foto: null, google: false, creado: hoy(), datos: datosVacios() };
      return persistir();
    },

    iniciarSesion({ correo, clave }) {
      correo = limpio(correo).toLowerCase();
      if (!correo || !clave) return falla('Escribe tu correo y tu contraseña.');
      const u = db().usuarios[correo];
      if (!u || u.clave !== huella(clave, u.sal)) return falla('Correo o contraseña incorrectos.');
      db().sesion = correo;
      const r = persistir(); if (!r.ok) return r;
      marcarRacha();
      return ok(publico(u));
    },

    cuentasGoogle() {
      const propias = Object.values(db().usuarios)
        .filter((u) => !CUENTAS_GOOGLE.some((c) => c.correo === u.correo))
        .map((u) => ({ nombre: u.nombre, correo: u.correo, foto: u.foto }));
      return [...CUENTAS_GOOGLE.map((c) => ({ ...c, foto: (db().usuarios[c.correo] || {}).foto || null })), ...propias];
    },

    // Entra con una cuenta de la lista de Google. Las de prueba se crean con datos de ejemplo.
    entrarConGoogle(correo) {
      correo = limpio(correo).toLowerCase();
      const d = db();
      if (!d.usuarios[correo]) {
        const demo = CUENTAS_GOOGLE.find((c) => c.correo === correo);
        if (!demo) return falla('No encontramos esa cuenta.');
        const sal = uid();
        d.usuarios[correo] = { nombre: demo.nombre, correo, sal, clave: huella('prueba123', sal), foto: null, google: true, creado: hoy(), datos: datosDemo() };
      }
      d.sesion = correo;
      const r = persistir(); if (!r.ok) return r;
      marcarRacha();
      return ok(publico(d.usuarios[correo]));
    },

    cerrarSesion() { db().sesion = null; return persistir(); },

    // Sin servidor no se envían correos: se valida que la cuenta exista y se pasa a crear la nueva contraseña.
    solicitarRecuperacion(correo) {
      correo = limpio(correo).toLowerCase();
      if (!correoValido(correo)) return falla('Escribe un correo válido.');
      if (!db().usuarios[correo]) return falla('No encontramos una cuenta con ese correo.');
      return ok(correo);
    },

    restablecerClave({ correo, clave, confirmar }) {
      const u = db().usuarios[limpio(correo).toLowerCase()];
      if (!u) return falla('No encontramos la cuenta.');
      if (String(clave || '').length < 8) return falla('Usa mínimo 8 caracteres.');
      if (clave !== confirmar) return falla('Las contraseñas no coinciden.');
      u.sal = uid(); u.clave = huella(clave, u.sal);
      return persistir();
    },
  };

  function publico(u) {
    return { nombre: u.nombre, correo: u.correo, foto: u.foto, google: !!u.google };
  }

  // ================================================================ PERFIL
  const perfil = {
    cambiarNombre(nombre) {
      nombre = limpio(nombre);
      if (!nombre) return falla('El nombre no puede estar vacío.');
      if (nombre.length > 60) return falla('El nombre es muy largo.');
      usuarioActual().nombre = nombre;
      return persistir();
    },
    cambiarClave({ actual, clave, confirmar }) {
      const u = usuarioActual();
      if (huella(actual || '', u.sal) !== u.clave) return falla('La contraseña actual no es correcta.');
      if (String(clave || '').length < 8) return falla('La nueva contraseña debe tener mínimo 8 caracteres.');
      if (clave !== confirmar) return falla('Las contraseñas no coinciden.');
      u.sal = uid(); u.clave = huella(clave, u.sal);
      return persistir();
    },
    cambiarFoto(dataURL) {
      if (dataURL && !/^data:image\//.test(dataURL)) return falla('El archivo no es una imagen.');
      usuarioActual().foto = dataURL || null;
      return persistir();
    },
    eliminarCuenta() {
      const d = db();
      const correo = d.sesion;
      if (!correo) return falla('No hay sesión iniciada.');
      delete d.usuarios[correo];
      d.sesion = null;
      return persistir();
    },
  };

  // ============================================================== MATERIAS
  function validarHorarios(horarios) {
    if (!Array.isArray(horarios) || !horarios.length) return 'Agrega al menos un horario.';
    for (let i = 0; i < horarios.length; i++) {
      const h = horarios[i];
      if (!DIAS.includes(h.dia)) return `Elige el día del horario ${i + 1}.`;
      if (!horaValida(h.inicio) || !horaValida(h.fin)) return `Revisa la hora del horario ${i + 1}.`;
      if (h.fin <= h.inicio) return `En el horario ${i + 1}, la hora final debe ser después de la inicial.`;
    }
    return null;
  }

  const materias = {
    listar: () => copia(datos().materias),
    obtener: (id) => { const m = datos().materias.find((x) => x.id === id); return m ? copia(m) : null; },

    guardar({ id, nombre, profesor, horarios }) {
      nombre = limpio(nombre);
      if (!nombre) return falla('Escribe el nombre de la materia.');
      const lista = datos().materias;
      if (lista.some((m) => m.id !== id && m.nombre.toLowerCase() === nombre.toLowerCase())) return falla('Ya tienes una materia con ese nombre.');
      const hs = (horarios || []).map((h) => ({ id: h.id || uid(), dia: h.dia, inicio: h.inicio, fin: h.fin, salon: limpio(h.salon) }));
      const error = validarHorarios(hs); if (error) return falla(error);
      let m;
      if (id) {
        m = lista.find((x) => x.id === id);
        if (!m) return falla('La materia ya no existe.');
        Object.assign(m, { nombre, profesor: limpio(profesor), horarios: hs });
      } else {
        m = { id: uid(), nombre, profesor: limpio(profesor), horarios: hs };
        lista.push(m);
      }
      const r = persistir();
      return r.ok ? ok(copia(m)) : r;
    },

    // Al eliminar una materia se borran sus flashcards y notas; sus tareas quedan "Sin materia".
    eliminar(id) {
      const d = datos();
      const m = d.materias.find((x) => x.id === id);
      if (!m) return falla('La materia ya no existe.');
      d.materias = d.materias.filter((x) => x.id !== id);
      d.flashcards = d.flashcards.filter((f) => f.materiaId !== id);
      d.tareas.forEach((t) => { if (t.materiaId === id) t.materiaId = ''; });
      delete d.notas[id];
      const r = persistir();
      return r.ok ? ok(copia(m)) : r;
    },

    nombre(id) {
      const m = datos().materias.find((x) => x.id === id);
      return m ? m.nombre : 'Sin materia';
    },

    // Clases de un día de la semana, ordenadas por hora.
    clasesDelDia(iso) {
      const dia = DIAS[indiceDia(deISO(iso))];
      return datos().materias
        .flatMap((m) => m.horarios.filter((h) => h.dia === dia).map((h) => ({ materiaId: m.id, nombre: m.nombre, profesor: m.profesor, ...h })))
        .sort((a, b) => a.inicio.localeCompare(b.inicio));
    },
  };

  // ================================================================ TAREAS
  const ordenTareas = (a, b) => ((a.fecha || '9999') + (a.hora || '')).localeCompare((b.fecha || '9999') + (b.hora || ''));

  const tareas = {
    listar: () => copia(datos().tareas).sort(ordenTareas),
    pendientes: () => tareas.listar().filter((t) => !t.hecha),
    hechas: () => tareas.listar().filter((t) => t.hecha).reverse(),
    obtener: (id) => { const t = datos().tareas.find((x) => x.id === id); return t ? copia(t) : null; },
    delDia: (iso) => tareas.listar().filter((t) => t.fecha === iso),
    fechasConTareas: () => new Set(datos().tareas.filter((t) => !t.hecha && t.fecha).map((t) => t.fecha)),

    guardar({ id, titulo, materiaId, fecha, hora, descripcion }) {
      titulo = limpio(titulo);
      if (!titulo) return falla('Escribe el título de la tarea.');
      if (!materiaId) return falla('Selecciona la materia.');
      if (!datos().materias.some((m) => m.id === materiaId)) return falla('La materia seleccionada ya no existe.');
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return falla('Elige la fecha de entrega.');
      if (hora && !horaValida(hora)) return falla('Revisa la hora de cierre.');
      const obj = { titulo, materiaId, fecha, hora: hora || '23:59', descripcion: limpio(descripcion) };
      const lista = datos().tareas;
      let t;
      if (id) {
        t = lista.find((x) => x.id === id);
        if (!t) return falla('La tarea ya no existe.');
        Object.assign(t, obj);
      } else {
        t = { id: uid(), hecha: false, ...obj };
        lista.push(t);
      }
      const r = persistir();
      return r.ok ? ok(copia(t)) : r;
    },

    alternar(id) {
      const t = datos().tareas.find((x) => x.id === id);
      if (!t) return falla('La tarea ya no existe.');
      t.hecha = !t.hecha;
      if (t.hecha) marcarRacha();
      const r = persistir();
      return r.ok ? ok(copia(t)) : r;
    },

    eliminar(id) {
      const d = datos();
      const t = d.tareas.find((x) => x.id === id);
      if (!t) return falla('La tarea ya no existe.');
      d.tareas = d.tareas.filter((x) => x.id !== id);
      const r = persistir();
      return r.ok ? ok(copia(t)) : r;
    },
  };

  // ============================================================ FLASHCARDS
  const flashcards = {
    listar: (materiaId) => copia(datos().flashcards.filter((f) => !materiaId || f.materiaId === materiaId)),
    obtener: (id) => { const f = datos().flashcards.find((x) => x.id === id); return f ? copia(f) : null; },
    contar: (materiaId) => datos().flashcards.filter((f) => f.materiaId === materiaId).length,

    // Materias que ya tienen al menos una flashcard
    materiasConTarjetas() {
      const d = datos();
      return d.materias.filter((m) => d.flashcards.some((f) => f.materiaId === m.id)).map((m) => ({ id: m.id, nombre: m.nombre, total: flashcards.contar(m.id) }));
    },

    guardar({ id, materiaId, pregunta, respuesta }) {
      pregunta = limpio(pregunta); respuesta = limpio(respuesta);
      if (!materiaId) return falla('Selecciona la materia.');
      if (!datos().materias.some((m) => m.id === materiaId)) return falla('La materia seleccionada ya no existe.');
      if (!pregunta) return falla('Escribe la pregunta.');
      if (!respuesta) return falla('Escribe la respuesta.');
      const lista = datos().flashcards;
      let f;
      if (id) {
        f = lista.find((x) => x.id === id);
        if (!f) return falla('La flashcard ya no existe.');
        Object.assign(f, { materiaId, pregunta, respuesta });
      } else {
        f = { id: uid(), materiaId, pregunta, respuesta };
        lista.push(f);
      }
      const r = persistir();
      return r.ok ? ok(copia(f)) : r;
    },

    eliminar(id) {
      const d = datos();
      const f = d.flashcards.find((x) => x.id === id);
      if (!f) return falla('La flashcard ya no existe.');
      d.flashcards = d.flashcards.filter((x) => x.id !== id);
      const r = persistir();
      return r.ok ? ok(copia(f)) : r;
    },
  };

  // ======================================================== NOTAS / SIMULADOR
  function pesosPorDefecto(n) {
    if (n === 3) return [30, 30, 40];
    const base = Math.floor(100 / n);
    const w = Array(n).fill(base);
    w[n - 1] += 100 - base * n;
    return w;
  }

  const notas = {
    APROBAR: NOTA_APROBAR,
    MAXIMA: NOTA_MAX,

    // Notas guardadas de una materia (o las de por defecto).
    deMateria(materiaId) {
      const n = datos().notas[materiaId];
      if (!n) return { periodos: 3, pesos: pesosPorDefecto(3), notas: ['', '', ''] };
      const periodos = n.periodos || 3;
      const pesos = Array.isArray(n.pesos) && n.pesos.length === periodos ? n.pesos.slice() : pesosPorDefecto(periodos);
      const ns = Array.from({ length: periodos }, (_, i) => (n.notas && n.notas[i] != null ? String(n.notas[i]) : ''));
      return { periodos, pesos, notas: ns };
    },

    pesosPorDefecto,

    guardar(materiaId, { periodos, pesos, notas: ns }) {
      if (!datos().materias.some((m) => m.id === materiaId)) return falla('La materia ya no existe.');
      periodos = Math.min(6, Math.max(1, Number(periodos) || 3));
      datos().notas[materiaId] = {
        periodos,
        pesos: Array.from({ length: periodos }, (_, i) => Number((pesos || [])[i]) || 0),
        notas: Array.from({ length: periodos }, (_, i) => limpio((ns || [])[i])),
      };
      return persistir();
    },

    // Calcula la nota que se necesita en los periodos sin nota para aprobar.
    calcular({ pesos, notas: ns }) {
      const w = pesos.map((p) => aNumero(p));
      if (w.some((p) => p === null || p < 0)) return falla('Revisa los porcentajes: deben ser números positivos.');
      const total = w.reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.001) return falla(`Los porcentajes suman ${+total.toFixed(1)}%. Ajústalos para que sumen 100%.`);
      let acumulado = 0, restante = 0;
      for (let i = 0; i < w.length; i++) {
        const txt = limpio(ns[i]);
        if (txt === '' || txt === '--') { restante += w[i]; continue; }
        const x = aNumero(txt);
        if (x === null || x < NOTA_MIN || x > NOTA_MAX) return falla(`La nota del periodo ${i + 1} debe estar entre 0,0 y 5,0.`);
        acumulado += x * w[i] / 100;
      }
      if (restante === 0) {
        const aprobo = acumulado >= NOTA_APROBAR - 1e-9;
        return ok({ tipo: 'final', definitiva: acumulado, aprobo,
          mensaje: aprobo ? '¡Aprobaste la materia!' : 'No alcanzaste el 3,0. Habla con tu docente sobre opciones de recuperación.' });
      }
      const necesaria = (NOTA_APROBAR - acumulado) / (restante / 100);
      let mensaje;
      if (necesaria <= 0) mensaje = '¡Ya aprobaste la materia con lo que llevas!';
      else if (necesaria > NOTA_MAX) mensaje = 'Necesitarías más de 5,0. Habla con tu docente y busca refuerzos.';
      else if (necesaria <= 3) mensaje = 'Vas muy bien, ¡sigue así!';
      else mensaje = '¡Tú puedes! Dale prioridad a esta materia.';
      return ok({ tipo: 'necesaria', necesaria: Math.max(0, necesaria), acumulado, restante, mensaje });
    },

    promedioMateria(materiaId) {
      const n = datos().notas[materiaId]; if (!n) return null;
      const { pesos, notas: ns } = notas.deMateria(materiaId);
      let s = 0, ws = 0;
      ns.forEach((v, i) => { const x = aNumero(v); if (x !== null) { s += x * pesos[i]; ws += pesos[i]; } });
      return ws ? s / ws : null;
    },
  };

  // =========================================================== ESTADÍSTICAS
  const estadisticas = {
    resumen() {
      const d = datos();
      const proms = d.materias.map((m) => notas.promedioMateria(m.id)).filter((v) => v !== null);
      const promedio = proms.length ? proms.reduce((a, b) => a + b, 0) / proms.length : null;
      return {
        promedio,
        materias: d.materias.length,
        pendientes: d.tareas.filter((t) => !t.hecha).length,
        racha: rachaVigente(),
      };
    },
    // % de tareas hechas por materia
    progreso() {
      const d = datos();
      return d.materias.map((m) => {
        const ts = d.tareas.filter((t) => t.materiaId === m.id);
        const hechas = ts.filter((t) => t.hecha).length;
        return { id: m.id, nombre: m.nombre, total: ts.length, porcentaje: ts.length ? Math.round(hechas / ts.length * 100) : 0 };
      });
    },
  };

  global.Api = {
    auth, perfil, materias, tareas, flashcards, notas, estadisticas,
    racha: { marcar: marcarRacha, actual: rachaVigente },
    util: { hoy, sumarDias, deISO, fechaISO, indiceDia, pad, DIAS, aNumero },
  };
})(window);
