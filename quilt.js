/**
 * The Digital Thread - Vanilla JavaScript
 * - Generates per-block CSS-grid cells using --grid-size
 * - Modal: shows clicked block + centered text
 * - Bottom nav: prev/next + counter (1/8)
 * - Mobile/tablet: swipe-down to close (bottom sheet)
 */

(function () {
  "use strict";

  // ---------- Grid cells ----------
  function generateCells() {
    const grids = document.querySelectorAll(".block-grid");
    grids.forEach((grid) => {
      const styles = getComputedStyle(grid);
      const size = parseInt(styles.getPropertyValue("--grid-size"), 10) || 4;

      const total = size * size;
      grid.innerHTML = "";

      for (let i = 1; i <= total; i++) {
        const cell = document.createElement("div");
        cell.className = `cell cell-${i}`;
        grid.appendChild(cell);
      }
    });
  }

  function initQuiltHover() {
  document.querySelectorAll(".quilt-block").forEach(block => {
    const cells = block.querySelectorAll(".cell");
    if (!cells.length) return;

    block.addEventListener("mouseenter", () => {
  gsap.to(block.querySelector(".block-grid"), {
    scale: 1.02,
    duration: 0.35,
    ease: "power2.out"
  });
});

block.addEventListener("mouseleave", () => {
  gsap.to(block.querySelector(".block-grid"), {
    scale: 1,
    duration: 0.35,
    ease: "power2.out"
  });
});

  });
}

  // ---------- Modal + navigation ----------
  function setupModal() {
  const overlay = document.getElementById("modal");              // ✅ tu HTML
  const closeBtn = document.getElementById("modal-close");       // ✅ tu HTML
  const titleEl = document.getElementById("modal-title");        // ✅ tu HTML
  const descEl = document.getElementById("modal-description");   // ✅ tu HTML
  const previewEl = document.querySelector(".modal-block-preview");

  const nav = document.querySelector(".modal-nav");
  const navCount = nav?.querySelector(".modal-nav-count");
  const prevBtn = nav?.querySelector('[data-dir="-1"]');
  const nextBtn = nav?.querySelector('[data-dir="1"]');

  const blocks = Array.from(document.querySelectorAll(".quilt-block"));
  if (!overlay || !closeBtn || !titleEl || !descEl || !previewEl || blocks.length === 0) return;

  let currentIndex = 0;

  function setCounter(i) {
    if (!navCount) return;
    navCount.textContent = `${i + 1}/${blocks.length}`;
  }

  function renderPreview(block) {
    previewEl.innerHTML = "";

    const grid = block.querySelector(".block-grid");
    if (!grid) return;

    const cloneWrap = document.createElement("div");
    cloneWrap.className = "quilt-block is-preview";

    const cloneGrid = grid.cloneNode(true);
    cloneWrap.appendChild(cloneGrid);
    previewEl.appendChild(cloneWrap);

    // Si por lo que sea el clon no trae celdas, las regeneramos
    if (!cloneGrid.querySelector(".cell")) {
      const styles = getComputedStyle(grid);
      const size = parseInt(styles.getPropertyValue("--grid-size"), 10) || 4;
      const total = size * size;
      cloneGrid.innerHTML = "";
      for (let i = 1; i <= total; i++) {
        const cell = document.createElement("div");
        cell.className = `cell cell-${i}`;
        cloneGrid.appendChild(cell);
      }
    }
  }

  function openAt(index) {
  currentIndex = (index + blocks.length) % blocks.length;
  const block = blocks[currentIndex];

  // ✅ Revertir antes de cambiar texto (si ya se había aplicado)
  if (titleEl._splitInstance) {
    titleEl._splitInstance.revert();
    titleEl._splitInstance = null;
  }

  // ✅ Ahora sí: actualiza el texto según el bloque clicado
  titleEl.textContent = block.dataset.name || "";
  descEl.textContent = block.dataset.description || "";

  renderPreview(block);
  setCounter(currentIndex);

  // ✅ Aplica SplitText con el texto ya correcto
  const split = new SplitText(titleEl, { type: "chars" });
  titleEl._splitInstance = split;

  gsap.from(split.chars, {
    y: 24,
    autoAlpha: 0,
    stagger: { amount: 0.2 },
    duration: 0.6,
    ease: "power2.out"
  });

  overlay.classList.add("active");
  lockScroll();
}


  function close() {
    overlay.classList.remove("active");
    if (typeof unlockScroll === "function") unlockScroll();
  }

  function step(dir) {
    openAt(currentIndex + dir);
  }

  // --- Click en bloques para abrir ---
  blocks.forEach((block, index) => {
    block.addEventListener("click", () => openAt(index));

    // Accesibilidad teclado
    block.setAttribute("tabindex", "0");
    block.setAttribute("role", "button");
    block.setAttribute("aria-label", block.dataset.name || "Open block");

    block.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(index);
      }
    });
  });

  // --- Cerrar modal ---
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    // solo cerrar si clicas el fondo, no el contenido
    if (e.target === overlay) close();
  });

  // --- Teclado ---
  document.addEventListener("keydown", (e) => {
    const isOpen = overlay.classList.contains("active");

    if (e.key === "Escape" && isOpen) close();
    if (!isOpen) return;

    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // --- Nav buttons (si existen en tu HTML) ---
  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));

  // ---------- Swipe-down to close (bottom sheet) ----------
  const sheet = document.querySelector(".modal-content");
  if (!sheet) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;

  const canSwipe = () => window.matchMedia("(max-width: 1023px)").matches;

  const onStart = (y) => {
    if (!canSwipe()) return;
    if (!overlay.classList.contains("active")) return;

    dragging = true;
    startY = y;
    currentY = 0;
    sheet.classList.add("dragging");
  };

  const onMove = (y) => {
    if (!dragging) return;
    currentY = Math.max(0, y - startY);
    sheet.style.transform = `translateY(${currentY}px)`;
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;

    const threshold = Math.min(160, window.innerHeight * 0.2);
    sheet.classList.remove("dragging");

    if (currentY > threshold) {
      sheet.style.transform = "";
      close();
    } else {
      sheet.style.transform = "";
    }
  };

  sheet.addEventListener("touchstart", (e) => onStart(e.touches[0].clientY), { passive: true });
  sheet.addEventListener("touchmove", (e) => onMove(e.touches[0].clientY), { passive: true });
  sheet.addEventListener("touchend", onEnd);

  // Mouse (útil para test responsive)
  sheet.addEventListener("mousedown", (e) => onStart(e.clientY));
  window.addEventListener("mousemove", (e) => onMove(e.clientY));
  window.addEventListener("mouseup", onEnd);
}


function animateSplitTitle(target) {
  if (!window.gsap || !window.SplitText) return;

  const el = typeof target === "string" ? document.querySelectorAll(target) : target;
  if (!el) return;

  // Revertir si ya se había aplicado SplitText (para abrir/cerrar sin romper DOM)
  if (el._splitInstance) {
    el._splitInstance.revert();
    el._splitInstance = null;
  }

  const split = new SplitText(el, { type: "chars" });
  el._splitInstance = split;

  gsap.from(split.chars, {
    y: 40,
    autoAlpha: 0,
    stagger: { amount: 0.5 },
    duration: 0.8,
    ease: "power2.out"
  });
}

function animateQuiltBlocks() {
  gsap.from(".quilt-block", {
    scale: 1,
    autoAlpha: 0,
    duration: 1,
    stagger: {
      amount: 0.5,
      from: "start",
      grid: "auto"
    },
    ease: "back.out(1.4)"
  });
}  // ---------- Custom Cursor ----------
  function initCustomCursor() {
    // Solo en desktop
    if (window.innerWidth < 1024) return;

    // Crear cursor
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    
    // Contenedor del marquee
    const marquee = document.createElement('div');
    marquee.className = 'marquee';
    
    // Contenido original
    const content1 = document.createElement('div');
    content1.className = 'marquee-content';
    content1.textContent = 'CLICK · CLICK · CLICK · ';
    
    // Contenido duplicado (exactamente igual)
    const content2 = document.createElement('div');
    content2.className = 'marquee-content';
    content2.textContent = 'CLICK · CLICK · CLICK · ';
    
    // Añadir ambos al marquee
    marquee.appendChild(content1);
    marquee.appendChild(content2);
    cursor.appendChild(marquee);
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Seguir mouse con suavizado
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      const speed = 0.15;
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;
      
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover en bloques
    const blocks = document.querySelectorAll('.quilt-block');
    blocks.forEach(block => {
      block.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
      });
      
      block.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
      });
    });

    // Hover en botones del modal
    const buttons = document.querySelectorAll('button, .modal-nav-btn');
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
      });
      
      btn.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
      });
    });
  }

document.addEventListener("DOMContentLoaded", () => {
  generateCells();
  initQuiltHover(); 
  setupModal();
  animateSplitTitle(".title");
  animateQuiltBlocks();
  initCustomCursor();
});

})();


