(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Sticky nav shadow */
  var nav = document.getElementById("siteNav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Nav stays dark while it sits over the dark hero */
  var heroBlock = document.getElementById("hero");
  if (nav && heroBlock && heroBlock.dataset.nav && "IntersectionObserver" in window) {
    var tone = "on-" + (heroBlock.dataset.nav || "dark");
    new IntersectionObserver(function (entries) {
      nav.classList.toggle(tone, entries[0].isIntersecting);
    }, { rootMargin: "-72px 0px 0px 0px", threshold: 0 }).observe(heroBlock);
  }

  /* Mobile menu */
  var menuToggle = document.getElementById("menuToggle");
  var menuClose = document.getElementById("menuClose");
  var mobileMenu = document.getElementById("mobileMenu");
  function openMenu() {
    mobileMenu.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", openMenu);
    menuClose.addEventListener("click", closeMenu);
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  var wait = function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  };

  /* Hero typewriter: types a phrase, sweeps a highlighter over it, moves on */
  var typer = document.getElementById("typer");
  if (typer) {
    var phrases = ["complex yet intuitive", "powerful yet simple", "designed and written together"];
    var tyText = typer.querySelector(".ty-text");
    var onScreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; }).observe(typer);
    }
    var whenVisible = function () {
      return new Promise(function (resolve) {
        (function check() { onScreen && !document.hidden ? resolve() : setTimeout(check, 400); })();
      });
    };
    if (reduceMotion) {
      typer.classList.add("is-marked", "is-idle");
    } else {
      (async function run() {
        tyText.textContent = "";
        await wait(400);
        for (var i = 0; ; i = (i + 1) % phrases.length) {
          await whenVisible();
          typer.className = "typer";
          for (var n = 1; n <= phrases[i].length; n++) { tyText.textContent = phrases[i].slice(0, n); await wait(65); }
          await wait(250);
          typer.classList.add("is-marked", "is-idle");
          await wait(2800);
          typer.className = "typer";
          await wait(450);
          while (tyText.textContent.length) { tyText.textContent = tyText.textContent.slice(0, -1); await wait(24); }
          await wait(300);
        }
      })();
    }
  }

  /* Skills playground: the skill pills drop into a box and can be grabbed and thrown */
  var pit = document.getElementById("skillPit");
  if (pit && window.Matter && !reduceMotion && window.matchMedia("(min-width: 761px) and (pointer: fine)").matches) {
    var M = window.Matter;
    var skills = pit.closest(".skills-section");
    skills.classList.add("is-physics");
    var legend = document.createElement("div");
    legend.className = "pit-legend";
    legend.setAttribute("aria-hidden", "true");
    var pills = [];
    skills.querySelectorAll(".skill-row").forEach(function (row, g) {
      var key = document.createElement("span");
      key.className = "pit-key";
      key.dataset.group = g;
      key.textContent = row.querySelector("h3").textContent;
      legend.appendChild(key);
      row.querySelectorAll(".pill").forEach(function (pill) {
        var el = document.createElement("span");
        el.className = "pit-pill";
        el.dataset.group = g;
        el.textContent = pill.textContent;
        pit.appendChild(el);
        pills.push(el);
      });
    });
    pit.after(legend);

    var engine = M.Engine.create();
    var W = pit.clientWidth, H = pit.clientHeight, T = 80;
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(W / 2, H + T / 2, W * 2, T, { isStatic: true }),
      M.Bodies.rectangle(-T / 2, H / 2, T, H * 4, { isStatic: true }),
      M.Bodies.rectangle(W + T / 2, H / 2, T, H * 4, { isStatic: true })
    ]);
    var bodies = pills.map(function (el, n) {
      var w = el.offsetWidth, h = el.offsetHeight;
      var body = M.Bodies.rectangle(w / 2 + Math.random() * (W - w), -h - n * 38, w, h, {
        chamfer: { radius: h / 2 }, restitution: 0.4, friction: 0.25, frictionAir: 0.012,
        angle: (Math.random() - 0.5) * 0.8
      });
      body.el = el; body.w = w; body.h = h;
      return body;
    });
    /* Grab with the pointer: a spring ties the grabbed pill to the cursor */
    var grab = null;
    var local = function (e) {
      var box = pit.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    pit.addEventListener("pointerdown", function (e) {
      var body = bodies.find(function (b) { return b.el === e.target; });
      if (!body) return;
      var at = local(e);
      grab = M.Constraint.create({
        pointA: at, bodyB: body,
        pointB: { x: at.x - body.position.x, y: at.y - body.position.y },
        stiffness: 0.12, damping: 0.08, length: 0
      });
      M.Composite.add(engine.world, grab);
      pit.setPointerCapture(e.pointerId);
      pit.classList.add("is-grabbing");
      e.preventDefault();
    });
    pit.addEventListener("pointermove", function (e) { if (grab) grab.pointA = local(e); });
    var letGo = function () {
      if (!grab) return;
      M.Composite.remove(engine.world, grab);
      grab = null;
      pit.classList.remove("is-grabbing");
    };
    pit.addEventListener("pointerup", letGo);
    pit.addEventListener("pointercancel", letGo);

    var sync = function () {
      bodies.forEach(function (b) {
        b.el.style.transform = "translate(" + (b.position.x - b.w / 2) + "px," + (b.position.y - b.h / 2) + "px) rotate(" + b.angle + "rad)";
      });
      requestAnimationFrame(sync);
    };
    var dropped = false;
    new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || dropped) return;
      dropped = true;
      M.Composite.add(engine.world, bodies);
      M.Runner.run(M.Runner.create(), engine);
      pit.classList.add("is-live");
      sync();
    }, { threshold: 0.4 }).observe(pit);
  }

  /* Reading progress on case studies */
  var progress = document.getElementById("readProgress");
  if (progress) {
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  /* Contents rail: mark the section being read */
  var tocLinks = document.querySelectorAll(".case-toc a, .toc-m a");
  var tocNow = document.querySelector(".toc-m-now");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) { var id = a.getAttribute("href").slice(1); (byId[id] = byId[id] || []).push(a); });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove("is-current"); a.removeAttribute("aria-current"); });
        (byId[entry.target.id] || []).forEach(function (link) { link.classList.add("is-current"); link.setAttribute("aria-current", "true"); });
        if (tocNow && byId[entry.target.id]) tocNow.textContent = byId[entry.target.id][0].textContent;
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* Phone contents: close after choosing a section, or when tapping elsewhere */
  var tocM = document.querySelector(".toc-m");
  if (tocM) {
    tocM.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { tocM.open = false; }); });
    document.addEventListener("click", function (e) { if (tocM.open && !tocM.contains(e.target)) tocM.open = false; });
  }

  /* Light / dark switch: follows the system until the visitor picks, then remembers */
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var current = function () { return document.documentElement.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light"); };
    var label = function () { themeBtn.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme"); };
    label();
    themeBtn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
    if (darkQuery.addEventListener) darkQuery.addEventListener("change", label);
  }

  /* Live local time in Stockholm */
  var localTime = document.getElementById("localTime");
  if (localTime && window.Intl) {
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" });
    var tickTime = function () { localTime.textContent = "It's " + fmt.format(new Date()) + " there now"; };
    tickTime();
    localTime.hidden = false;
    setInterval(tickTime, 30000);
  }

  /* Count up big numbers the first time they scroll into view */
  /* where a results lead exists, it is the one number that counts up */
  var counters = document.querySelectorAll(document.querySelector("[data-rs]") ? ".rs-lead .num" : ".stat-num, .result-card .num, .callout-stat .num");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        /* Only the leading text changes, so a small unit (like "weeks") keeps its styling */
        var node = entry.target.firstChild;
        if (!node || node.nodeType !== 3) return;
        var match = node.textContent.match(/^(\D*)(\d+)(.*)$/);
        if (!match) return;
        var target = +match[2], start = null;
        var step = function (t) {
          if (start === null) start = t;
          var k = Math.min((t - start) / 1100, 1);
          node.textContent = match[1] + Math.round(target * (1 - Math.pow(1 - k, 3))) + match[3];
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        /* If the browser pauses animation frames, still land on the real number */
        setTimeout(function () { node.textContent = match[1] + target + match[3]; }, 1400);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* Screen images fade in once loaded instead of popping into an empty frame */
  document.querySelectorAll(".scr-pic").forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add("is-wait");
    var done = function () { img.classList.remove("is-wait"); };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });

  /* Result bars grow once when the band scrolls into view */
  var rsBand = document.querySelector("[data-rs]");
  if (rsBand) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var rsIO = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { rsBand.classList.add("is-in"); rsIO.disconnect(); }
      }, { threshold: 0.4 });
      rsIO.observe(rsBand);
      setTimeout(function () { var r = rsBand.getBoundingClientRect(); if (r.top < innerHeight) rsBand.classList.add("is-in"); }, 1500);
    } else { rsBand.classList.add("is-static"); }
  }

  /* Scroll reveal — triggers early so content is never caught blank */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Before/after compare: the range input drives the split position */
  document.querySelectorAll(".compare").forEach(function (fig) {
    var range = fig.querySelector(".compare-range");
    var update = function () { fig.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", update);
    update();
  });

  /* Coded UI illustrations play their small moment once, when they come into view */
  var uis = document.querySelectorAll(".ui");
  if (uis.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var uiIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-live");
          uiIO.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      uis.forEach(function (el) { uiIO.observe(el); });
    } else {
      uis.forEach(function (el) { el.classList.add("is-live"); });
    }
  }

  /* Home: show projects by skill */
  var workGrid = document.getElementById("workGrid");
  var filterButtons = document.querySelectorAll(".work-filter button");
  if (workGrid && filterButtons.length) {
    var tiles = workGrid.querySelectorAll(".work-tile");
    var workCount = document.getElementById("workCount");
    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var skill = btn.getAttribute("data-skill");
        var shown = 0;
        filterButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        tiles.forEach(function (tile) {
          var match = skill === "all" || tile.getAttribute("data-skills").split(" ").indexOf(skill) !== -1;
          tile.hidden = !match;
          if (match) shown++;
        });
        workGrid.classList.toggle("is-filtered", skill !== "all");
        if (workCount) workCount.textContent = shown + (shown === 1 ? " project" : " projects") + " shown";
      });
    });
  }

  /* Hide the top-bar Email button while the contact block is on screen */
  var ctaBlock = document.querySelector(".t-cta-panel");
  if (nav && ctaBlock && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("cta-in-view", entries[0].isIntersecting);
    }, { threshold: 0.3 }).observe(ctaBlock);
  }

  /* Case studies: click a screenshot to see it full size */
  var zoomables = [].filter.call(document.querySelectorAll(".case-body .solution-media img"), function (i) { return !i.closest(".scr"); });
  if (zoomables.length && window.HTMLDialogElement) {
    var box = document.createElement("dialog");
    box.className = "lightbox";
    box.setAttribute("aria-label", "Enlarged image");
    box.innerHTML = '<button class="lb-close" type="button" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(box);
    var bigImg = box.querySelector("img");
    zoomables.forEach(function (img) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zoom-btn";
      btn.setAttribute("aria-label", "Enlarge image: " + img.alt);
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener("click", function () {
        var options = (img.getAttribute("srcset") || "").split(",");
        bigImg.src = options.length > 1 ? options[options.length - 1].trim().split(" ")[0] : img.currentSrc || img.src;
        bigImg.alt = img.alt;
        box.classList.remove("is-zoomed");
        box.showModal();
      });
    });
    bigImg.addEventListener("click", function () { box.classList.toggle("is-zoomed"); });
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lb-close")) box.close();
    });
  }

  /* Screen recordings play only while on screen, and never for reduced motion */
  var videos = document.querySelectorAll("video.shot-video");
  if (videos.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      videos.forEach(function (v) { v.controls = true; });
    } else {
      var videoIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.play().catch(function () { entry.target.controls = true; }); }
          else { entry.target.pause(); }
        });
      }, { threshold: 0.35 });
      videos.forEach(function (v) { videoIO.observe(v); });
    }
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var answer = item.querySelector(".faq-a");
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (open) {
        if (open !== item) {
          open.classList.remove("is-open");
          open.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          open.querySelector(".faq-a").style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
})();

/* Coded screens: hotspots that spotlight a zone and show the original annotation */
(function () {
  var screens = document.querySelectorAll("[data-notes]");
  var seen = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-seen"); seen.unobserve(e.target); } });
  }, { threshold: 0.35 }) : null;
  screens.forEach(function (fig) {
    var layer = fig.querySelector(".hs-layer");
    var dots = fig.querySelectorAll(".hs");
    var list = fig.querySelector(".hs-list");
    var all = fig.querySelector(".hs-all");
    var css = getComputedStyle(layer);
    var W = +css.getPropertyValue("--w"), H = +css.getPropertyValue("--h");
    var NS = "http://www.w3.org/2000/svg";
    var dim = document.createElementNS(NS, "svg");
    dim.setAttribute("class", "hs-dim");
    dim.setAttribute("viewBox", "0 0 " + W + " " + H);
    dim.setAttribute("preserveAspectRatio", "none");
    dim.setAttribute("aria-hidden", "true");
    var hole = document.createElementNS(NS, "path");
    dim.appendChild(hole);
    layer.insertBefore(dim, layer.firstChild);
    if (seen) seen.observe(fig); else fig.classList.add("is-seen");
    /* room for a 250px note column beside the screen? */
    var frame = fig.querySelector(".scr-frame");
    function fit() {
      fig.classList.remove("has-side");
      fig.classList.toggle("has-side", fig.clientWidth - Math.min(frame.offsetWidth, 440) >= 300);
      open().forEach(place);
    }
    fit();
    window.addEventListener("resize", fit);

    dots.forEach(function (dot, i) {
      dot.style.setProperty("--i", i);
      dot.rects = (dot.dataset.zones || "").split(";").filter(Boolean).map(function (z) { return z.trim().split(/\s+/).map(Number); });
      dot.zones = dot.rects.map(function (r) {
        var el = document.createElement("i");
        el.className = "hs-zone";
        el.style.cssText = "left:" + r[0] + "em;top:" + r[1] + "em;width:" + r[2] + "em;height:" + r[3] + "em";
        layer.insertBefore(el, dim.nextSibling);
        return el;
      });
      var note = dot.querySelector(".hs-note");
      var li = document.createElement("li");
      li.textContent = note.textContent;
      list.appendChild(li);
      note.innerHTML = '<span class="hs-kicker">' + (fig.dataset.tone === "fix" ? "Change " : "Problem ") + (i + 1) + " of " + dots.length + '</span><span class="hs-text"></span>';
      note.lastChild.textContent = li.textContent;
      dot.setAttribute("aria-label", "Note " + (i + 1) + ": " + li.textContent);
      dot.addEventListener("click", function () { toggle(dot, dot.getAttribute("aria-expanded") !== "true"); });
      dot.addEventListener("mouseenter", function () { if (!fig.classList.contains("show-all")) spot([dot]); });
      dot.addEventListener("mouseleave", function () { if (!fig.classList.contains("show-all")) spot(open()); });
    });

    function open() { return [].filter.call(dots, function (d) { return d.getAttribute("aria-expanded") === "true"; }); }
    /* light the zones of the given dots and cut them out of the dimmed layer */
    function spot(active) {
      var d = "M0 0H" + W + "V" + H + "H0Z";
      dots.forEach(function (dot) {
        var on = active.indexOf(dot) > -1;
        dot.zones.forEach(function (z) { z.classList.toggle("is-on", on); });
        if (on) dot.rects.forEach(function (r) {
          var x = r[0], y = r[1], w = r[2], h = r[3], k = Math.min(6, w / 2, h / 2);
          d += "M" + (x + k) + " " + y + "H" + (x + w - k) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + k) + "V" + (y + h - k) + "Q" + (x + w) + " " + (y + h) + " " + (x + w - k) + " " + (y + h) + "H" + (x + k) + "Q" + x + " " + (y + h) + " " + x + " " + (y + h - k) + "V" + (y + k) + "Q" + x + " " + y + " " + (x + k) + " " + y + "Z";
        });
      });
      hole.setAttribute("d", d);
      fig.classList.toggle("is-focus", active.length > 0);
    }
    function toggle(dot, show) {
      dots.forEach(function (d) { if (d !== dot) d.setAttribute("aria-expanded", "false"); });
      dot.setAttribute("aria-expanded", String(show));
      if (!fig.classList.contains("show-all")) spot(show ? [dot] : []);
      if (show) place(dot);
    }
    /* keep the note inside the screen: right of the dot, else left, else below */
    function place(dot) {
      var note = dot.querySelector(".hs-note");
      var box = layer.getBoundingClientRect();
      dot.classList.remove("flip", "below", "side");
      note.style.removeProperty("--dx");
      if (fig.classList.contains("has-side")) {
        var d = dot.getBoundingClientRect();
        dot.style.setProperty("--off", Math.round(box.right + 36 - d.right) + "px");
        dot.classList.add("side");
        return;
      }
      var r = note.getBoundingClientRect();
      if (r.right <= box.right - 8) return;
      dot.classList.add("flip");
      r = note.getBoundingClientRect();
      if (r.left >= box.left + 8) return;
      dot.classList.remove("flip");
      dot.classList.add("below");
      r = note.getBoundingClientRect();
      var dx = Math.min(0, box.right - 8 - r.right) + Math.max(0, box.left + 8 - r.left);
      note.style.setProperty("--dx", dx + "px");
    }
    all.addEventListener("click", function () {
      var on = all.getAttribute("aria-pressed") !== "true";
      all.setAttribute("aria-pressed", String(on));
      all.textContent = on ? "Hide notes" : "Show all notes";
      fig.classList.toggle("show-all", on);
      list.hidden = !on;
      dots.forEach(function (d) { d.setAttribute("aria-expanded", "false"); });
      spot(on ? [].slice.call(dots) : []);
    });
    document.addEventListener("click", function (e) { if (!fig.contains(e.target) && open().length) toggle(open()[0], false); });
    fig.addEventListener("keydown", function (e) { if (e.key === "Escape" && open().length) { var d = open()[0]; toggle(d, false); d.focus(); } });
  });
})();

/* Coded "after" screens: short looping demos of the redesigned flows.
   They play only while on screen, can be paused, and stay still for reduced motion. */
(function () {
  var figs = document.querySelectorAll("[data-ani]");
  if (!figs.length) return;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function player(fig, scr, steps, reset, rest, loops) {
    var timer = null, i = 0, on = false, paused = false;
    function next() {
      if (!on || paused) return;
      if (i >= steps.length) {
        if (!loops) return;
        i = 0; timer = setTimeout(function () { reset(); next(); }, 0); return;
      }
      var step = steps[i++];
      timer = setTimeout(function () { step[1](); next(); }, step[0]);
    }
    function play() { if (on && !paused && timer === null) { next(); } }
    function stop() { clearTimeout(timer); timer = null; }
    if (still) { rest(); return; }
    reset();
    if (loops) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "ani-pause"; btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Pause animation");
      btn.addEventListener("click", function () {
        paused = !paused; btn.setAttribute("aria-pressed", String(paused));
        btn.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
        if (paused) { stop(); } else { timer = null; play(); }
      });
      (scr.closest(".phone") || fig).appendChild(btn);
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { on = e.isIntersecting; if (on) { timer = null; play(); } else { stop(); } });
    }, { threshold: 0.4 }).observe(scr);
  }

  function pointer(scr, cls) { var p = document.createElement("i"); p.className = cls; scr.appendChild(p); return p; }
  function at(p, x, y) { p.style.setProperty("--px", x); p.style.setProperty("--py", y); }
  function press(el) { el.classList.add("is-press"); setTimeout(function () { el.classList.remove("is-press"); }, 180); }

  figs.forEach(function (fig) {
    var kind = fig.dataset.ani;

    if (kind === "doc") {
      var scr = fig.querySelector(".sdv"), input = scr.querySelector(".sdv-compose input");
      var send = scr.querySelector(".sdv-compose .sdv-send"), accept = scr.querySelector(".sdv-accept");
      var cur = pointer(scr, "ani-cursor"), word = "Ann Connor", typing = [];
      for (var k = 1; k <= word.length; k++) (function (n) { typing.push([85, function () { input.value = word.slice(0, n); }]); })(k);
      function setState(st, open) { scr.dataset.state = st; scr.classList.toggle("card-open", open); }
      player(fig, scr, [[700, function () { at(cur, 640, 372); }], [700, function () { cur.classList.add("is-text"); }]]
        .concat(typing)
        .concat([
          [450, function () { cur.classList.remove("is-text"); at(cur, 904, 373); }],
          [800, function () { press(send); }],
          [220, function () { setState("review", true); }],
          [1500, function () { at(cur, 840, 365); }],
          [800, function () { press(accept); }],
          [220, function () { setState("accepted", false); at(cur, 980, 520); }],
          [2600, function () {}]
        ]),
        function () { setState("compose", false); input.value = ""; cur.classList.remove("is-text"); at(cur, 1000, 560); },
        function () { setState("review", true); },
        true);
    }

    if (kind === "sheet") {
      var s2 = fig.querySelector(".sms"), kebab = s2.querySelector(".sms-kebab"), acc = s2.querySelector(".sms-acc");
      var tap = pointer(s2, "ani-tap");
      function menu(open) { s2.classList.toggle("menu-open", open); }
      player(fig, s2, [
          [700, function () { at(tap, 353, 476); tap.classList.add("is-on"); }],
          [700, function () { press(tap); press(kebab); }],
          [200, function () { menu(true); }],
          [1100, function () { at(tap, 322, 530); }],
          [650, function () { acc.classList.add("is-hover"); press(tap); }],
          [350, function () { menu(false); acc.classList.remove("is-hover"); tap.classList.remove("is-on"); }],
          [2400, function () {}]
        ],
        function () { menu(false); acc.classList.remove("is-hover"); tap.classList.remove("is-on"); at(tap, 300, 640); },
        function () { menu(true); },
        true);
    }

    if (kind === "email") {
      var s3 = fig.querySelector(".sem");
      player(fig, s3, [[150, function () { s3.classList.add("is-in"); }]],
        function () { s3.classList.remove("is-in"); },
        function () { s3.classList.add("is-in"); },
        false);
    }
  });
})();

/* Mobile suggest-edit demo: select, toolbar, type a suggestion, send, open it */
(function () {
  var fig = document.querySelector('[data-ani="mobile"]');
  if (!fig) return;
  var scr = fig.querySelector(".smf"), typed = scr.querySelector(".smf-typed span");
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) { scr.classList.add("show-name", "show-reply"); return; }
  var tap = document.createElement("i"); tap.className = "ani-tap"; scr.appendChild(tap);
  function at(x, y) { tap.style.setProperty("--px", x); tap.style.setProperty("--py", y); }
  function show(cls, on) { scr.classList.toggle(cls, on); }
  function press() { tap.classList.add("is-press"); setTimeout(function () { tap.classList.remove("is-press"); }, 180); }
  var word = "Ann Connor", steps = [
    [700, function () { at(78, 403); tap.classList.add("is-on"); }],
    [650, function () { tap.classList.add("is-hold"); }],
    [650, function () { show("show-hl", true); tap.classList.remove("is-hold"); }],
    [350, function () { show("show-menu", true); tap.classList.remove("is-on"); }],
    [1100, function () { at(216, 665); tap.classList.add("is-on"); }],
    [650, press],
    [200, function () { show("show-menu", false); show("show-hl", false); show("show-kb", true); tap.classList.remove("is-on"); }]
  ];
  for (var k = 1; k <= word.length; k++) (function (n) { steps.push([n === 1 ? 800 : 110, function () { typed.textContent = word.slice(0, n); scr.classList.add("is-typed"); }]); })(k);
  steps = steps.concat([
    [600, function () { at(352, 473); tap.classList.add("is-on"); }],
    [650, press],
    [200, function () { show("show-kb", false); show("show-name", true); tap.classList.remove("is-on"); }],
    [1300, function () { at(160, 408); tap.classList.add("is-on"); }],
    [650, press],
    [200, function () { show("show-reply", true); tap.classList.remove("is-on"); }],
    [3000, function () {}]
  ]);
  function reset() { ["show-hl", "show-menu", "show-kb", "show-name", "show-reply"].forEach(function (c) { show(c, false); }); typed.textContent = ""; scr.classList.remove("is-typed"); tap.className = "ani-tap"; at(200, 600); }
  var i = 0, timer = null, on = false, paused = false;
  function next() {
    if (!on || paused) return;
    if (i >= steps.length) { i = 0; reset(); }
    var s = steps[i++];
    timer = setTimeout(function () { s[1](); next(); }, s[0]);
  }
  reset();
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "ani-pause"; btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-label", "Pause animation");
  btn.addEventListener("click", function () {
    paused = !paused; btn.setAttribute("aria-pressed", String(paused)); btn.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    clearTimeout(timer); if (!paused) next();
  });
  (scr.closest(".phone") || fig).appendChild(btn);
  new IntersectionObserver(function (es) { es.forEach(function (e) { on = e.isIntersecting; clearTimeout(timer); if (on) next(); }); }, { threshold: 0.4 }).observe(scr);
})();

/* Homepage morph row: the hovered or focused card opens, the rest narrow. Cards keep their places. */
(function () {
  var row = document.querySelector(".mc-row");
  if (!row) return;
  var cards = [].slice.call(row.querySelectorAll(".mc"));
  var mq = window.matchMedia("(min-width: 861px) and (hover: hover)");
  var GROW = 4.2, GAP = 12, intent = null;
  function size() {
    // the open card's width, so every card's picture is laid out at that size and strips crop it
    var n = cards.length, w = row.clientWidth - GAP * (n - 1);
    row.style.setProperty("--mc-open-w", Math.round(w * GROW / (GROW + n - 1)) + "px");
    // the open card fills what is left of the first screen, so the whole hero fits in view
    if (mq.matches) {
      var top = row.getBoundingClientRect().top + window.scrollY;
      // leave a thin band at the bottom, so only the tips of the quote cards below show as a teaser
      // The cards take the screen, but always leave a calm gap (at least 48px) and let only the tips of the
      // quote cards show above the fold (about 64px), on any screen height.
      var PEEK = 64, GAP = 48, h = Math.max(320, Math.min(1000, window.innerHeight - top - PEEK - GAP));
      row.style.setProperty("--mc-h", h + "px");
      var hero = row.closest(".t-hero");
      if (hero) hero.style.paddingBottom = Math.max(GAP, window.innerHeight - top - h - PEEK) + "px";
      fit(w * GROW / (GROW + n - 1));
    } else { row.style.removeProperty("--mc-h"); var hr = row.closest(".t-hero"); if (hr) hr.style.paddingBottom = ""; }
  }
  // For each card, pick the largest picture box that stays clear of the text column and the button:
  // either the full height left of the button, or the full width above the button row.
  var ctx = document.createElement("canvas").getContext("2d");
  function textW(el, maxCh) {
    var cs = getComputedStyle(el); ctx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var words = el.textContent.trim().split(/\s+/), limit = maxCh * ctx.measureText("0").width, line = "", widest = 0;
    words.forEach(function (wd) { var t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > limit && line) { widest = Math.max(widest, ctx.measureText(line).width); line = wd; } else line = t; });
    return Math.max(widest, ctx.measureText(line).width);
  }
  function lineCount(el, px) {
    var cs = getComputedStyle(el); ctx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var n = 1, line = "";
    el.textContent.trim().split(/\s+/).forEach(function (wd) { var t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > px && line) { n++; line = wd; } else line = t; });
    return n;
  }
  function fit(W) {
    var H = parseFloat(row.style.getPropertyValue("--mc-h")) || row.clientHeight;
    // the pills-and-title block is measured on the open card, where it has its full width
    var openCard = row.querySelector(".mc.is-open") || cards[0], topEl = openCard.querySelector(".mc-top");
    var topH = topEl ? topEl.offsetHeight : 0;
    var pills = openCard.querySelector(".mc-pills"), pillsH = pills ? pills.offsetHeight : 0;
    var closedW = W / GROW;
    cards.forEach(function (c) {
      var cap = c.querySelector(".mc-cap"), img = c.querySelector(".mc-media img"), btn = c.querySelector(".mc-arrow");
      if (!cap || !img || !btn) return;
      var P = parseFloat(getComputedStyle(cap).paddingLeft), B = btn.offsetWidth, gap = 20;
      var num = c.querySelector(".mc-num"), statH = parseFloat(getComputedStyle(num).fontSize);
      var statW = textW(num, 99) + 12 + textW(c.querySelector(".mc-lab"), 99);
      var top = P + topH + gap, r = (+img.getAttribute("width")) / (+img.getAttribute("height"));
      var bleed = c.getAttribute("href") === "case-suggestions.html";
      function area(b) { var w = W - b.l - b.r, h = H - b.t - b.b; if (w <= 0 || h <= 0) return 0; var fw = Math.min(w, h * r); return fw * fw / r; }
      // the picture sits under the title block and either above the stat row (wide) or beside the stat (tall)
      var wide = { t: top, r: P, b: P + Math.max(statH, B) + gap, l: P };
      var tall = { t: top, r: 2 * P + B, b: bleed ? 0 : P, l: P + statW + 32 };
      if (bleed) {
        // the hand photo is empty in its bottom-right corner, so it may run over the button column
        var hb = { t: top, r: P, b: 0, l: P + statW + 32 }, bw = W - hb.l - hb.r, bh = H - hb.t;
        var fw = Math.min(bw, bh * r), fh = fw / r;
        if ((fw - B) / fw >= 0.75 && (fh - (P + B)) / fh >= 0.78) tall = hb;
      }
      var box = bleed ? tall : (area(tall) >= area(wide) ? tall : wide);
      c.style.setProperty("--oi", box.t + "px " + box.r + "px " + box.b + "px " + box.l + "px");
      c.style.setProperty("--op", bleed ? "right bottom" : "center");
      // closed card: the picture sits below the (reserved) pills row and the title, with 16px padding
      var name = c.querySelector(".mc-name"), ncs = getComputedStyle(name), lh = parseFloat(ncs.lineHeight) || 20;
      var lines = lineCount(name, Math.max(40, closedW - 32));
      c.style.setProperty("--ci", Math.round(16 + pillsH + 12 + lines * lh + 14) + "px 16px " + (bleed ? 0 : 16) + "px 16px");
    });
  }

  function open(card) {
    cards.forEach(function (c) { c.classList.toggle("is-open", c === card); });
  }
  cards.forEach(function (c) {
    // a short hover intent, so sweeping the cursor across the row does not ripple every card
    c.addEventListener("mouseenter", function () { if (!mq.matches) return; clearTimeout(intent); intent = setTimeout(function () { open(c); }, 120); });
    c.addEventListener("mouseleave", function () { clearTimeout(intent); });
    c.addEventListener("focus", function () { clearTimeout(intent); open(c); });
  });
  size();
  window.addEventListener("resize", size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
})();

/* Tools belt: keep each tooltip inside the visible part of the row, away from the faded edges */
(function () {
  var belt = document.querySelector(".tools-belt");
  if (!belt) return;
  // Endless loop: one "set" is the visible tools; copies are added until the track is at least
  // one set wider than the belt, then the track slides by exactly one set and starts over seamlessly.
  var track = belt.querySelector(".tools-track");
  var set = [].slice.call(track.querySelectorAll(".tool[tabindex]"));
  function fill() {
    if (!set.length) return;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var setW = set.reduce(function (w, el) { return w + el.offsetWidth + gap; }, 0);
    var need = belt.clientWidth + setW, have = track.scrollWidth;
    while (have < need) {
      set.forEach(function (el) { var c = el.cloneNode(true); c.removeAttribute("tabindex"); c.removeAttribute("aria-label"); c.setAttribute("aria-hidden", "true"); track.appendChild(c); });
      have = track.scrollWidth;
    }
    track.style.setProperty("--belt-shift", -Math.round(setW) + "px");
    track.style.animationDuration = Math.round(setW / 28) + "s";   // about 28px per second at any width
  }
  fill();
  window.addEventListener("resize", fill);
  function place(tool) {
    var tip = tool.querySelector(".tool-tip"); if (!tip) return;
    tip.style.setProperty("--tx", "0px");
    var b = belt.getBoundingClientRect(), t = tool.getBoundingClientRect(), w = tip.offsetWidth, edge = b.width * 0.07;
    var left = t.left + t.width / 2 - w / 2, min = b.left + edge, max = b.right - edge - w;
    var shift = left < min ? min - left : (left > max ? max - left : 0);
    tip.style.setProperty("--tx", Math.round(shift) + "px");
  }
  belt.querySelectorAll(".tool").forEach(function (tool) {
    tool.addEventListener("mouseenter", function () { place(tool); });
    tool.addEventListener("focus", function () { place(tool); });
  });
})();

/* About: approach steps. Hover, focus or click shows that step's one-line how. */
(function () {
  var list = document.querySelector(".ap-list");
  if (!list) return;
  var steps = [].slice.call(list.querySelectorAll(".ap-step")), t = null;
  function pick(step) {
    steps.forEach(function (s) {
      var on = s === step;
      s.classList.toggle("is-on", on);
      s.querySelector(".ap-btn").setAttribute("aria-expanded", on ? "true" : "false");
    });
  }
  steps.forEach(function (s) {
    var b = s.querySelector(".ap-btn");
    b.addEventListener("click", function () { pick(s); });
    b.addEventListener("focus", function () { pick(s); });
    b.addEventListener("mouseenter", function () { clearTimeout(t); t = setTimeout(function () { pick(s); }, 80); });
    b.addEventListener("mouseleave", function () { clearTimeout(t); });
  });
})();

/* About: the first screen is centred in the space above the fold, and the next section's heading
   always peeks just above it, so the page reads as continuing on any screen height */
(function () {
  var grid = document.querySelector(".ab-grid"), next = document.querySelector(".ab-work");
  if (!grid || !next) return;
  var PEEK = 72;
  function place() {
    var GAP = Math.round(Math.min(96, Math.max(56, window.innerHeight * 0.09)));
    if (window.innerWidth < 1024) { grid.style.minHeight = ""; next.style.paddingTop = ""; return; }
    next.style.paddingTop = GAP + "px";
    var top = grid.getBoundingClientRect().top + window.scrollY;
    grid.style.minHeight = Math.max(0, window.innerHeight - PEEK - GAP - top) + "px";
  }
  place();
  window.addEventListener("resize", place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();
