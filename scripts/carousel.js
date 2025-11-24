// IIFE principal: inicializa carrusel, pagos, QR y analítica
(()=>{
  // Referencias DOM esenciales
  const slidesTrack = document.querySelector('.slides');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const prevBtn = document.querySelector('.carousel-nav.prev');
  const nextBtn = document.querySelector('.carousel-nav.next');
  const dotsContainer = document.querySelector('.carousel-dots');
  const qrModal = document.getElementById('qr-modal');
  const qrImage = document.getElementById('qr-image');
  const qrClose = document.getElementById('qr-close');
  const statusEl = document.getElementById('carousel-status');

  let index = 0;

  // update(): aplica desplazamiento y estados ARIA del slide activo
  function update(){
    slidesTrack.style.transform = `translateX(${-index*100}%)`;
    // Dots estado
    Array.from(dotsContainer.children).forEach((dot,i)=>{
      const active = i === index;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
      dot.tabIndex = active ? 0 : -1;
    });
    // aria-hidden en inactivos
    slides.forEach((sl,i)=>{
      sl.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    // Anuncio accesible del estado actual
    if(statusEl){
      const total = slides.length;
      const current = index + 1;
      const name = slides[index]?.dataset?.title || slides[index]?.querySelector('h3')?.innerText || '';
      statusEl.textContent = `Mostrando ${current} de ${total}${name ? `: ${name}` : ''}`;
    }
  }

  // createDots(): genera indicadores de página y gestiona navegación por teclado
  function createDots(){
    slides.forEach((sl,i)=>{
      if(!sl.id){ sl.id = `slide-${i+1}`; }
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.setAttribute('role','tab');
      dot.setAttribute('aria-controls', sl.id);
      dot.setAttribute('aria-label', `Ir a la página ${i+1}`);
      dot.addEventListener('click', ()=>{ index = i; update(); });
      dotsContainer.appendChild(dot);
    });
    // Manejo de teclado (ArrowLeft/ArrowRight/Home/End) para roving tabindex
    dotsContainer.addEventListener('keydown', (e)=>{
      const key = e.key;
      const total = slides.length;
      let handled = false;
      if(key === 'ArrowRight'){ index = (index + 1) % total; handled = true; }
      else if(key === 'ArrowLeft'){ index = (index - 1 + total) % total; handled = true; }
      else if(key === 'Home'){ index = 0; handled = true; }
      else if(key === 'End'){ index = total - 1; handled = true; }
      else if(key === 'Enter' || key === ' '){ // activar
        const currentDot = dotsContainer.children[index];
        currentDot && currentDot.click();
        handled = true;
      }
      if(handled){
        e.preventDefault();
        update();
        const activeDot = dotsContainer.children[index];
        activeDot && activeDot.focus();
      }
    });
  }

  prevBtn && prevBtn.addEventListener('click', ()=>{ index = (index - 1 + slides.length) % slides.length; update(); });
  nextBtn && nextBtn.addEventListener('click', ()=>{ index = (index + 1) % slides.length; update(); });

  // Lógica de compra / QR
  slides.forEach(slide=>{
    const buy = slide.querySelector('.buy-button');
    const qr = slide.querySelector('.qr-button');
    const mpUrl = slide.dataset.mpUrl;
    const createPref = slide.dataset.createPref === 'true';
    const title = slide.dataset.title || '';
    const price = Number(slide.dataset.price) || 0;
    const currency = slide.dataset.currency || 'ARS';
    const description = (slide.querySelector('p')||{}).innerText || '';
    const waProductLink = document.querySelector('.whatsapp-float');

    // Si existe data-mp-url se usa directamente. La lógica de createPreference sólo se mantiene
    // para compatibilidad futura si se vuelve a activar data-create-pref.
    // createPreference(): llamada opcional al backend para generar preferencia MP
    async function createPreference(){
      const res = await fetch('/create-preference', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title, price, currency, quantity:1, description })
      });
      if(!res.ok) throw new Error('Error servidor '+res.status);
      const data = await res.json();
      return data.init_point || data.url || data.redirect_url || data.checkout_url || data.payment_url;
    }

    // Evento compra: abre enlace MP directo o crea preferencia
    buy && buy.addEventListener('click', async()=>{
      try{
        if(mpUrl){
          window.open(mpUrl,'_blank');
          return;
        }
        if(createPref){
          const url = await createPreference();
          if(!url) return alert('No se recibió URL de pago del servidor.');
          window.open(url,'_blank');
          return;
        }
        if(!mpUrl){
          alert('Reemplaza el enlace de Mercado Pago en "data-mp-url".');
          return;
        }
      }catch(err){
        console.error(err);
        alert('Error al crear preferencia.');
      }
    });

    // Evento QR: genera código y abre modal accesible
    qr && qr.addEventListener('click', async()=>{
      try{
        let link='';
        if(mpUrl){
          link = mpUrl;
        } else if(createPref){
          link = await createPreference();
          if(!link) return alert('No se recibió URL de pago del servidor.');
        } else {
          alert('Falta data-mp-url para generar el QR.');
          return;
        }
        const encoded = encodeURIComponent(link);
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
        openQrModal();
      }catch(err){
        console.error(err);
        alert('Error al generar QR.');
      }
    });

    // Ajuste dinámico: si existe botón flotante de WhatsApp, añadir mensaje contextual del producto al abrir.
    if(waProductLink){
      const baseHref = waProductLink.getAttribute('href');
      if(baseHref && baseHref.includes('api.whatsapp.com/send')){
        const u = new URL(baseHref);
        const currentText = u.searchParams.get('text') || '';
        // No sobreescribimos si ya se agregó el título; simple control
        if(!currentText.includes(title) && title){
          u.searchParams.set('text', `${currentText}\nConsulta sobre: ${title}`.trim());
          waProductLink.setAttribute('href', u.toString());
        }
      }
    }
  });

  let lastFocusedElement = null;
  // getFocusable(): lista de elementos enfocable dentro del modal
  function getFocusable(container){
    return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el=>!el.disabled && el.offsetParent !== null);
  }
  // openQrModal(): abre modal y coloca foco inicial
  function openQrModal(){
    lastFocusedElement = document.activeElement;
    qrModal.classList.add('open');
    qrModal.setAttribute('aria-hidden','false');
    const focusables = getFocusable(qrModal);
    (focusables[0]||qrClose).focus();
  }
  // closeQrModal(): cierra modal y devuelve foco al elemento previo
  function closeQrModal(){
    qrModal.classList.remove('open');
    qrModal.setAttribute('aria-hidden','true');
    qrImage.src='';
    if(lastFocusedElement && typeof lastFocusedElement.focus === 'function'){
      lastFocusedElement.focus();
    }
  }
  qrClose && qrClose.addEventListener('click', closeQrModal);

  // Keydown modal: Tab cicla foco y Escape cierra
  qrModal && qrModal.addEventListener('keydown', (e)=>{
    if(qrModal.getAttribute('aria-hidden') === 'true') return;
    if(e.key === 'Escape'){ e.preventDefault(); closeQrModal(); return; }
    if(e.key === 'Tab'){
      const focusables = getFocusable(qrModal);
      if(focusables.length === 0) return;
      const currentIndex = focusables.indexOf(document.activeElement);
      let nextIndex = currentIndex;
      if(e.shiftKey){
        nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
      }
      e.preventDefault();
      focusables[nextIndex].focus();
    }
  });

  qrModal && qrModal.addEventListener('click', (e)=>{
    if(e.target === qrModal){
      closeQrModal();
    }
  });

  createDots();
  update();

  // Scroll suave hacia la colección desde CTA del hero
  const seeBtn = document.querySelector('.see-collection-button');
  seeBtn && seeBtn.addEventListener('click', ()=>{
    const section = document.getElementById('coleccion');
    if(section){ section.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  // Analítica: push en clic comprar y WhatsApp
  const dataLayer = window.dataLayer || (window.dataLayer = []);
  document.querySelectorAll('.buy-button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const parent = btn.closest('.slide');
      dataLayer.push({
        event:'buy_click',
        product: parent?.dataset?.title || '',
        price: parent?.dataset?.price || '',
        currency: parent?.dataset?.currency || 'ARS'
      });
    });
  });
  document.querySelectorAll('a[href*="api.whatsapp.com/send"]').forEach(a=>{
    a.addEventListener('click', ()=>{
      dataLayer.push({
        event:'whatsapp_click',
        source: a.classList.contains('whatsapp-float') ? 'float' : (a.classList.contains('wa-inline')?'inline':'other')
      });
    });
  });
})();