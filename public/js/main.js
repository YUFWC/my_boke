/* ==========================================================================
   落叶归根 · 站点脚本（零依赖，约 4KB）
   1. 主题切换（跟随系统 + 本地记忆）
   2. 导航滚动阴影
   3. 首页轮播（淡入淡出 + 圆点 + 自动播放 + 悬停暂停 + 键盘）
   4. 滚动入场动画
   5. 图片灯箱
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 1. 主题 ---------- */
  var STORAGE_KEY = "crazy-theme";
  var root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  function initTheme() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* 隐私模式下 localStorage 可能不可用 */
    }
    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
      return;
    }
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  initTheme();

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      /* 忽略 */
    }
    btn.setAttribute("aria-label", next === "dark" ? "切换到浅色模式" : "切换到深色模式");
  });

  /* ---------- 2. 导航滚动阴影 ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 3. 轮播 ---------- */
  function initSlider() {
    var slider = document.querySelector("[data-slider]");
    if (!slider) return;

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slider__slide"));
    if (slides.length < 1) return;

    var dotsWrap = slider.querySelector(".slider__dots");
    var prevBtn = slider.querySelector(".slider__arrow--prev");
    var nextBtn = slider.querySelector(".slider__arrow--next");
    var index = 0;
    var timer = null;
    var INTERVAL = 5000;
    var dots = [];

    // 生成圆点
    if (dotsWrap && slides.length > 1) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slider__dot";
        dot.setAttribute("aria-label", "查看第 " + (i + 1) + " 张图片");
        dot.addEventListener("click", function () {
          go(i);
          restart();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    } else if (dotsWrap) {
      dotsWrap.style.display = "none";
    }

    if (slides.length < 2) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
    }

    function render() {
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === index);
        s.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
      });
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    function next() {
      go(index + 1);
    }

    function prev() {
      go(index - 1);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (slides.length < 2) return;
      stop();
      timer = setInterval(next, INTERVAL);
    }

    function restart() {
      stop();
      start();
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        next();
        restart();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        prev();
        restart();
      });
    }

    // 悬停 / 聚焦时暂停
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);

    // 触摸滑动
    var startX = null;
    slider.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );
    slider.addEventListener(
      "touchend",
      function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) next();
          else prev();
          restart();
        }
        startX = null;
      },
      { passive: true },
    );

    // 键盘
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        prev();
        restart();
      } else if (e.key === "ArrowRight") {
        next();
        restart();
      }
    });

    // 标签页隐藏时不空转
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    render();
    start();
  }

  /* ---------- 4. 滚动入场 ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    var reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          // 同屏元素依次错开，避免同时跳出
          el.style.transitionDelay = Math.min(i * 70, 350) + "ms";
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- 5. 灯箱 ---------- */
  function initLightbox() {
    var triggers = document.querySelectorAll("[data-zoom]");
    if (!triggers.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "图片预览");
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="关闭预览">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<img class="lightbox__img" alt="">';
    document.body.appendChild(box);

    var img = box.querySelector(".lightbox__img");
    var lastFocus = null;

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      lastFocus = document.activeElement;
      box.querySelector(".lightbox__close").focus();
    }

    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      img.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    triggers.forEach(function (el) {
      function trigger() {
        var source = el.getAttribute("data-zoom");
        if (!source) {
          var inner = el.querySelector("img");
          source = inner ? inner.getAttribute("src") : null;
        }
        if (!source) return;
        var altImg = el.querySelector("img");
        open(source, altImg ? altImg.getAttribute("alt") : "");
      }

      el.addEventListener("click", trigger);

      // 键盘可达：回车 / 空格
      if (el.getAttribute("tabindex") !== null) {
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            trigger();
          }
        });
      }
    });

    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest(".lightbox__close")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) close();
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initSlider();
    initReveal();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
