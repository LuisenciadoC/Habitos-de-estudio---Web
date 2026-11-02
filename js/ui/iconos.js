/* Íconos en SVG (trazo redondeado, como en el Figma). Toman el color del texto (currentColor). */
(function (global) {
  'use strict';

  const T = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  const P = {
    // Barra superior
    menu: `<rect x="1" y="1" width="22" height="22" rx="4.5" fill="currentColor"/><path d="M6 7.5h12M6 12h12M6 16.5h12" stroke="#FFF9EB" stroke-width="2" stroke-linecap="round"/>`,
    casa: `<path d="M2.5 11.2 12 3l9.5 8.2V21a.8.8 0 0 1-.8.8h-5.6v-6.3H8.9v6.3H3.3a.8.8 0 0 1-.8-.8z" fill="currentColor"/>`,
    calendario: `<g ${T}><rect x="2.5" y="4.5" width="19" height="17" rx="3"/><path d="M2.5 9.5h19M7.5 2.5v4M16.5 2.5v4"/></g>`,
    calculadora: `<g ${T}><rect x="2.5" y="2.5" width="19" height="19" rx="3"/><path d="M6.5 8h4M8.5 6v4M14 8h4M6.8 14.2l3 3m0-3-3 3M14 14.5h4M14 17.5h4"/></g>`,
    perfil: `<g ${T}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="9.8" r="3.3"/><path d="M5.9 18.6c1.3-2.1 3.5-3.2 6.1-3.2s4.8 1.1 6.1 3.2"/></g>`,
    fuego: `<g ${T}><path d="M12 21.5a7 7 0 0 0 7-7c0-4.2-3.1-6.2-4.2-10.3-2 2-3 4.1-3 6.2-1-1-2-2.2-2.1-4.1C7.6 8.4 5 11.2 5 14.5a7 7 0 0 0 7 7z"/><path d="M12 21.5a3 3 0 0 0 3-3c0-1.9-1.4-3-3-5-1.6 2-3 3.1-3 5a3 3 0 0 0 3 3z"/></g>`,
    // Navegación
    atras: `<path ${T} stroke-width="2.4" d="m15 5-7 7 7 7"/>`,
    adelante: `<path ${T} stroke-width="2.4" d="m9 5 7 7-7 7"/>`,
    abajo: `<path ${T} stroke-width="2.4" d="m5 9 7 7 7-7"/>`,
    salir: `<g ${T}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></g>`,
    // Acciones
    editar: `<g ${T}><path d="M14.4 5.6 18.4 9.6M4 20l1-5L15.6 4.4a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L9 19z"/></g>`,
    eliminar: `<g ${T}><path d="M3.5 6.5h17M9 6.5V3.8h6v2.7M5.3 6.5l1 13.2a1.2 1.2 0 0 0 1.2 1.1h9a1.2 1.2 0 0 0 1.2-1.1l1-13.2M10 10.5v6.5M14 10.5v6.5"/></g>`,
    check: `<path ${T} stroke-width="2.4" d="m5 12.5 4.5 4.5L19 7.5"/>`,
    mas: `<path ${T} stroke-width="2.2" d="M12 5v14M5 12h14"/>`,
    // Perfil
    usuario: `<g ${T}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></g>`,
    candado: `<g ${T}><rect x="4.5" y="11" width="15" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></g>`,
    camara: `<g ${T}><path d="M3 8.5a2 2 0 0 1 2-2h2.2l1.8-2.5h6l1.8 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/></g>`,
    imagen: `<g ${T}><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m21 16-5-5-9 9"/></g>`,
    // Simulador
    nota: `<g ${T}><circle cx="12" cy="8.5" r="5.5"/><path d="m8.6 12.8-1.6 8.2 5-2.7 5 2.7-1.6-8.2"/></g>`,
    porcentaje: `<g ${T} stroke-width="2.2"><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.6"/><circle cx="17" cy="17" r="2.6"/></g>`,
    // Login
    libro: `<g ${T} stroke-width="1.9"><path d="M12 20V6.5m0 13.5-1-.6a18 18 0 0 0-8-1.7V4.4a18 18 0 0 1 8 1.6L12 6.5m0 13.5 1-.6a18 18 0 0 1 8-1.7V4.4a18 18 0 0 0-8 1.6L12 6.5"/></g>`,
    reloj: `<g ${T} stroke-width="1.4"><circle cx="12" cy="13.5" r="8"/><path d="M12 9.5v4l3 2M9.5 2.5h5M12 2.5v3"/></g>`,
    ojo: `<g ${T} stroke-width="1.4"><path d="M2 12.5s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12.5" r="3"/><path d="M12 2.5v2M5.5 4.5l1.2 1.6M18.5 4.5l-1.2 1.6"/></g>`,
    viento: `<g ${T} stroke-width="1.4"><path d="M3 8.5h11a3 3 0 1 0-3-3M3 12.5h16a3 3 0 1 1-3 3M3 16.5h7"/></g>`,
    luna: `<g ${T} stroke-width="1.4"><path d="M20 14.5A8.5 8.5 0 1 1 10 4a7 7 0 0 0 10 10.5z"/><path d="M16 3.5h3l-3 3.5h3"/></g>`,
    vaso: `<g ${T} stroke-width="1.4"><path d="M5.5 3.5h13l-1.6 16.2a1.6 1.6 0 0 1-1.6 1.3H8.7a1.6 1.6 0 0 1-1.6-1.3z"/><path d="M6.3 10c2-.9 3.8-.9 5.7 0s3.7.9 5.7 0"/></g>`,
    brote: `<g ${T} stroke-width="1.4"><path d="M12 21v-9M12 12C12 8 9.5 5.5 5 5.5c0 4 2.5 6.5 7 6.5zM12 14c0-3.5 2.2-6 6.5-6 0 3.5-2.2 6-6.5 6zM8 21h8"/></g>`,
  };

  global.Ic = (nombre, clase = '') => `<svg class="ic ${clase}" viewBox="0 0 24 24" aria-hidden="true">${P[nombre] || ''}</svg>`;
})(window);
