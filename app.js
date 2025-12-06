(function () {
  "use strict";

  // --------- NEW: helper to auto-link URLs in text ----------
  function autoLink(text) {
    if (!text) return "";

    // Very simple URL matcher: http:// or https:// followed by non-space chars
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.replace(urlRegex, (url) => {
      const safeUrl = url.replace(/"/g, "&quot;");
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }
  // --------- END NEW HELPER ----------

  document.addEventListener("DOMContentLoaded", function () {
    // Render sections and carousel from projects.js data
    if (window.projectsData) {
      renderSectionsFromData(window.projectsData);
      renderCarouselFromData(window.projectsData);
    }

    // Then initialize interactive behaviors
    initCarousels();
    initNavbar();
    initImageLightbox();
  });

  // --------- IMAGE LIGHTBOX FOR SECTION PHOTOS ----------

  function initImageLightbox() {
    const lightbox = document.getElementById("image-lightbox");
    if (!lightbox) return;

    const imgEl = lightbox.querySelector("[data-lightbox-img]");
    const closeBtn = lightbox.querySelector("[data-lightbox-close]");
    const backdrop = lightbox.querySelector("[data-lightbox-backdrop]");

    if (!imgEl || !closeBtn || !backdrop) return;

    // All section images you want clickable:
    const clickableImages = document.querySelectorAll(".stack-item-image-row-img");

    if (!clickableImages.length) return;

    function openLightbox(source, alt) {
      imgEl.src = source;
      imgEl.alt = alt || "";
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      // Small delay is optional; here we can clear right away
      imgEl.src = "";
      imgEl.alt = "";
    }

    clickableImages.forEach((img) => {
      img.style.cursor = "zoom-in"; // optional visual hint

      img.addEventListener("click", () => {
        openLightbox(img.src, img.alt);
      });
    });

    // Close button
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });

    // Clicking outside the inner image/box should close
    backdrop.addEventListener("click", (e) => {
      // If click target *is* the backdrop, close. If you want
      // even clicks on inner area (outside the image) to close,
      // you can remove this check and always close.
      if (e.target === backdrop) {
        closeLightbox();
      }
    });

    // Escape key closes the lightbox
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  // --------- RENDER FUNCTIONS (from projects.js) ----------

  function renderSectionsFromData(data) {
    const root = document.getElementById("sections-root");
    if (!root || !Array.isArray(data.sections)) return;

    data.sections.forEach((section, index) => {
      const sectionEl = document.createElement("section");
      sectionEl.className =
        "stack-section" + (index > 0 ? " stack-section--second" : "");
      if (section.id) {
        sectionEl.id = section.id;
      }

      const card = document.createElement("div");
      card.className = "stack-card";

      // Tab
      if (section.tabLabel) {
        const tab = document.createElement("div");
        tab.className = "stack-tab";
        const tabSpan = document.createElement("span");
        tabSpan.textContent = section.tabLabel;
        tab.appendChild(tabSpan);
        card.appendChild(tab);
      }

      // Title
      if (section.title) {
        const titleEl = document.createElement("h3");
        titleEl.textContent = section.title;
        card.appendChild(titleEl);
      }

      // Description (unchanged; still plain text)
      if (section.description) {
        const descEl = document.createElement("p");
        descEl.textContent = section.description;
        card.appendChild(descEl);
      }

      // Grid items
      if (Array.isArray(section.items) && section.items.length) {
        const grid = document.createElement("div");
        grid.className = "stack-grid";

        section.items.forEach((item) => {
          const itemWrap = document.createElement("div");

          if (item.label) {
            const labelEl = document.createElement("div");
            labelEl.className = "stack-item-label";
            labelEl.textContent = item.label;
            itemWrap.appendChild(labelEl);
          }

          if (item.title) {
            const titleEl = document.createElement("div");
            titleEl.className = "stack-item-title";
            titleEl.textContent = item.title;
            itemWrap.appendChild(titleEl);
          }

          // ----- horizontal image row support -----
          // Preferred: item.images = [{ url, alt, href?, loading? }, ...]
          if (Array.isArray(item.images) && item.images.length > 0) {
            const imagesRow = document.createElement("div");
            imagesRow.className = "stack-item-image-row";

            item.images.forEach((imgData) => {
              const img = document.createElement("img");
              img.src = imgData.url;
              img.alt = imgData.alt || item.title || "";
              img.loading = imgData.loading || "lazy";
              img.className = "stack-item-image-row-img";

              // Optional: clickable images, if href is provided
              if (imgData.href) {
                const link = document.createElement("a");
                link.href = imgData.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.appendChild(img);
                imagesRow.appendChild(link);
              } else {
                imagesRow.appendChild(img);
              }
            });

            itemWrap.appendChild(imagesRow);
          }
          // Backward compatibility: single imageUrl / imageAlt
          else if (item.imageUrl) {
            const imagesRow = document.createElement("div");
            imagesRow.className = "stack-item-image-row";

            const img = document.createElement("img");
            img.src = item.imageUrl;
            img.alt = item.imageAlt || item.title || "";
            img.loading = "lazy";
            img.className = "stack-item-image-row-img";

            imagesRow.appendChild(img);
            itemWrap.appendChild(imagesRow);
          }
          // ----- END IMAGE ROW -----

          if (item.body) {
            const bodyEl = document.createElement("div");
            bodyEl.className = "stack-item-body";
            // --------- NEW: use autoLink + innerHTML so URLs are clickable ----------
            bodyEl.innerHTML = autoLink(item.body);
            // --------- END CHANGE ----------
            itemWrap.appendChild(bodyEl);
          }

          grid.appendChild(itemWrap);
        });

        card.appendChild(grid);
      }

      sectionEl.appendChild(card);
      root.appendChild(sectionEl);
    });
  }

  function renderCarouselFromData(data) {
    const carousel = document.querySelector("[data-carousel]");
    if (!carousel || !Array.isArray(data.carouselSlides)) return;

    const track = carousel.querySelector("[data-carousel-track]");
    if (!track) return;

    data.carouselSlides.forEach((slideData) => {
      const slide = document.createElement("div");
      slide.className = "carousel-slide";
      slide.setAttribute("data-carousel-slide", "");

      const img = document.createElement("img");
      img.src = slideData.imageUrl;
      img.alt = slideData.alt || "";
      img.loading = slideData.loading || "lazy";

      if (slideData.href) {
        const link = document.createElement("a");
        link.href = slideData.href;
        if (slideData.openInNewTab) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        link.appendChild(img);
        slide.appendChild(link);
      } else {
        slide.appendChild(img);
      }

      track.appendChild(slide);
    });
  }

  // --------- ORIGINAL CAROUSEL BEHAVIOR ----------

  function initCarousels() {
    const carousels = document.querySelectorAll("[data-carousel]");

    carousels.forEach((root) => {
      const slides = Array.from(root.querySelectorAll("[data-carousel-slide]"));
      const prevBtn = root.querySelector("[data-carousel-prev]");
      const nextBtn = root.querySelector("[data-carousel-next]");

      if (slides.length === 0) return;

      let index = 0;
      let timerId;

      function showSlide(newIndex) {
        slides[index].classList.remove("is-active");
        index = (newIndex + slides.length) % slides.length;
        slides[index].classList.add("is-active");
      }

      function next() {
        showSlide(index + 1);
      }

      function prev() {
        showSlide(index - 1);
      }

      function startTimer() {
        stopTimer();
        timerId = setInterval(next, 5000);
      }

      function stopTimer() {
        if (timerId) {
          clearInterval(timerId);
          timerId = undefined;
        }
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          next();
          startTimer();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          prev();
          startTimer();
        });
      }

      root.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          next();
          startTimer();
        } else if (e.key === "ArrowLeft") {
          prev();
          startTimer();
        }
      });

      root.addEventListener("mouseenter", stopTimer);
      root.addEventListener("mouseleave", startTimer);

      // Activate first slide and start autoplay
      slides[0].classList.add("is-active");
      startTimer();
    });
  }

  // --------- ORIGINAL NAVBAR BEHAVIOR ----------

  function initNavbar() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastKnownScrollPosition = 0;
    let ticking = false;

    function updateNavbarWidth(scrollPos) {
      if (scrollPos > 10) {
        navbar.classList.add("navbar--expanded");
      } else {
        navbar.classList.remove("navbar--expanded");
      }
    }

    window.addEventListener("scroll", () => {
      lastKnownScrollPosition = window.scrollY || window.pageYOffset;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateNavbarWidth(lastKnownScrollPosition);
          ticking = false;
        });
        ticking = true;
      }
    });

    updateNavbarWidth(window.scrollY || window.pageYOffset || 0);
  }
})();
