/* Pantallas de acceso: Login, Crear cuenta, Recuperar y Nueva contraseña, cuentas de Google. */
(function (global) {
  'use strict';
  const { Api, UI, Ic } = global;
  const { $, esc, campo } = UI;
  const V = global.Vistas = global.Vistas || {};

  let correoRecuperando = null;

  const error = (raiz, msg) => { $('[data-error]', raiz).textContent = msg; };

  // ------------------------------------------------------------------ Login
  V.login = () => ({
    publica: true,
    html: `<div class="auth">
      ${UI.ilustracion()}
      <section class="auth__panel">
        <div class="auth__logo">${Ic('libro')}</div>
        <div><h1 class="auth__titulo">Qué bueno verte de nuevo</h1>
        <p class="auth__subtitulo">Ingresa tus datos para seguir con tu racha</p></div>
        <form class="form-compacto" novalidate>
          ${campo('Correo electrónico', '<input class="input" id="correo" type="email" autocomplete="email" placeholder="Correo@ejemplo.com">', 'correo')}
          ${campo('Contraseña', '<input class="input" id="clave" type="password" autocomplete="current-password" placeholder="••••••••">', 'clave')}
          <div class="auth__olvido"><a class="enlace" href="#/recuperar">¿Olvidaste tu contraseña?</a></div>
          <p class="error" data-error></p>
          <button class="btn btn--crema btn--bloque" type="submit">Iniciar sesión</button>
          <a class="btn btn--rojo btn--bloque" href="#/registro">Crear cuenta</a>
        </form>
        <div class="separador-o">o</div>
        <button class="btn btn--crema btn--bloque" data-google>Continuar con Google</button>
        <p class="auth__pie">¿No tienes cuenta? <a href="#/registro">Regístrate</a></p>
      </section></div>`,
    montar(raiz) {
      $('form', raiz).onsubmit = (e) => {
        e.preventDefault();
        const r = Api.auth.iniciarSesion({ correo: $('#correo', raiz).value, clave: $('#clave', raiz).value });
        if (!r.ok) return error(raiz, r.error);
        global.App.ir('/inicio', `¡Hola, ${r.valor.nombre.split(' ')[0]}!`);
      };
      $('[data-google]', raiz).onclick = elegirCuentaGoogle;
    },
  });

  // --------------------------------------------- Login_Google (elegir cuenta)
  const COLORES = ['#5D0D18', '#7D8E89', '#B07A3B', '#4A6FA5', '#6B4E8A', '#3E7A5E'];
  function elegirCuentaGoogle() {
    const cuentas = Api.auth.cuentasGoogle();
    const raiz = $('#ventanas');
    raiz.innerHTML = `<div class="google" data-fondo><div class="google__ventana" role="dialog" aria-modal="true" aria-labelledby="g-titulo">
      <span class="google__logo"><b style="color:#4285F4">G</b><b style="color:#EA4335">o</b><b style="color:#FBBC05">o</b><b style="color:#4285F4">g</b><b style="color:#34A853">l</b><b style="color:#EA4335">e</b></span>
      <h2 class="google__titulo" id="g-titulo">Elige una cuenta</h2>
      <p class="google__sub">para ir a <b>Hábitos de Estudio</b></p>
      ${cuentas.map((c, i) => `<button class="google__cuenta" data-correo="${esc(c.correo)}">
          <span class="google__avatar" style="background:${COLORES[i % COLORES.length]}">${c.foto ? `<img src="${c.foto}" alt="">` : esc(c.nombre[0])}</span>
          <span><b>${esc(c.nombre)}</b><small>${esc(c.correo)}</small></span></button>`).join('')}
      <button class="google__cuenta" data-otra><span class="google__avatar" style="background:#e8eaed;color:#5f6368">${Ic('usuario')}</span><span><b>Usar otra cuenta</b></span></button>
      <p class="google__nota">Sin servidor no es posible validar cuentas reales de Google: estas son cuentas de prueba con datos de ejemplo y las cuentas creadas en este navegador.</p>
    </div></div>`;
    const cerrar = () => (raiz.innerHTML = '');
    $('[data-fondo]', raiz).addEventListener('mousedown', (e) => { if (e.target.hasAttribute('data-fondo')) cerrar(); });
    $('[data-otra]', raiz).onclick = () => { cerrar(); global.App.ir('/registro'); };
    raiz.querySelectorAll('[data-correo]').forEach((b) => (b.onclick = () => {
      const r = Api.auth.entrarConGoogle(b.dataset.correo);
      cerrar();
      if (!r.ok) return UI.aviso(r.error);
      global.App.ir('/inicio', `¡Hola, ${r.valor.nombre.split(' ')[0]}!`);
    }));
  }

  // Tarjeta centrada sobre la ilustración borrosa
  const tarjeta = (titulo, subtitulo, volver, cuerpo) => `<div class="auth auth--centrada">
      ${UI.ilustracion()}
      <section class="auth__tarjeta">
        <div class="auth__cabeza">
          <a class="boton-icono" href="#${volver}" aria-label="Volver">${Ic('atras')}</a>
          <div><h1 class="auth__titulo">${titulo}</h1><p class="auth__subtitulo">${subtitulo}</p></div><span></span>
        </div>
        ${cuerpo}
      </section></div>`;

  // ------------------------------------------------------------ Crear cuenta
  V.registro = () => ({
    publica: true,
    html: tarjeta('Crea tu cuenta', 'Organiza tus materias y estudia a diario.', '/login', `
      <form class="form-compacto" novalidate>
        ${campo('Nombre', '<input class="input" id="nombre" autocomplete="name" placeholder="Camila Torres">', 'nombre')}
        ${campo('Correo electrónico', '<input class="input" id="correo" type="email" autocomplete="email" placeholder="Correo@ejemplo.com">', 'correo')}
        ${campo('Contraseña', '<input class="input" id="clave" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres">', 'clave')}
        ${campo('Confirmar contraseña', '<input class="input" id="confirmar" type="password" autocomplete="new-password" placeholder="Repite tu contraseña">', 'confirmar')}
        <label class="check"><input type="checkbox" id="acepta"><span>Acepto los <b>Términos de servicio</b> y la <b>Política de privacidad</b></span></label>
        <p class="error" data-error></p>
        <button class="btn btn--rojo btn--bloque" type="submit">Crear cuenta</button>
      </form>
      <div class="separador-o">o regístrate con</div>
      <button class="btn btn--crema btn--bloque" data-google>Continuar con Google</button>
      <p class="auth__pie" style="padding-bottom:15px">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>`),
    montar(raiz) {
      $('[data-google]', raiz).onclick = elegirCuentaGoogle;
      $('form', raiz).onsubmit = (e) => {
        e.preventDefault();
        const v = (id) => $('#' + id, raiz).value;
        const r = Api.auth.registrar({ nombre: v('nombre'), correo: v('correo'), clave: v('clave'), confirmar: v('confirmar'), acepta: $('#acepta', raiz).checked });
        if (!r.ok) return error(raiz, r.error);
        global.App.ir('/login', 'Cuenta creada. Ya puedes iniciar sesión.');
      };
    },
  });

  // -------------------------------------------------- Recuperar contraseña
  V.recuperar = () => ({
    publica: true,
    html: tarjeta('Recupera tu contraseña', 'Escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva.', '/login', `
      <form class="form-compacto" novalidate>
        ${campo('Correo electrónico', '<input class="input" id="correo" type="email" autocomplete="email" placeholder="correo@ejemplo.com">', 'correo')}
        <p class="error" data-error></p>
        <button class="btn btn--rojo btn--bloque" type="submit">Enviar enlace</button>
      </form>
      <p class="auth__pie" style="padding-bottom:15px"><a href="#/login">Volver a iniciar sesión</a></p>`),
    montar(raiz) {
      $('form', raiz).onsubmit = (e) => {
        e.preventDefault();
        const r = Api.auth.solicitarRecuperacion($('#correo', raiz).value);
        if (!r.ok) return error(raiz, r.error);
        // Sin servidor no se envía el correo: se abre directamente la pantalla del enlace.
        correoRecuperando = r.valor;
        global.App.ir('/nueva-contrasena', 'Enlace verificado. Crea tu nueva contraseña.');
      };
    },
  });

  V['nueva-contrasena'] = () => ({
    publica: true,
    html: tarjeta('Nueva contraseña', 'Usa mínimo 8 caracteres.', '/recuperar', `
      <form class="form-compacto" novalidate>
        ${campo('Nueva contraseña', '<input class="input" id="clave" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres">', 'clave')}
        ${campo('Confirmar contraseña', '<input class="input" id="confirmar" type="password" autocomplete="new-password" placeholder="Repite tu contraseña">', 'confirmar')}
        <p class="error" data-error></p>
        <button class="btn btn--rojo btn--bloque" type="submit" style="margin-bottom:15px">Guardar contraseña</button>
      </form>`),
    montar(raiz) {
      if (!correoRecuperando) { global.App.ir('/recuperar'); return; }
      $('form', raiz).onsubmit = (e) => {
        e.preventDefault();
        const r = Api.auth.restablecerClave({ correo: correoRecuperando, clave: $('#clave', raiz).value, confirmar: $('#confirmar', raiz).value });
        if (!r.ok) return error(raiz, r.error);
        correoRecuperando = null;
        global.App.ir('/login', 'Contraseña cambiada correctamente.');
      };
    },
  });

  global.Recuperacion = { iniciar: (correo) => { correoRecuperando = correo; } };
})(window);
