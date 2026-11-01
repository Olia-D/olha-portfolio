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

  /* Polaroid: drag it around; a spring pulls it home and it swings as it goes */
  var polaroid = document.getElementById("polaroid");
  if (polaroid && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    polaroid.classList.add("is-draggable");
    var px = 0, py = 0, vx = 0, vy = 0, rot = -4, dragging = false, grabX = 0, grabY = 0, lastX = 0, lastY = 0, raf = null;
    var tick = function () {
      if (!dragging) {
        vx = (vx - px * 0.05) * 0.86;
        vy = (vy - py * 0.05) * 0.86;
        px += vx; py += vy;
      }
      rot += (-4 + Math.max(-16, Math.min(16, vx * 0.8)) - rot) * 0.18;
      polaroid.style.transform = "translate(" + px + "px," + py + "px) rotate(" + rot + "deg)";
      var moving = Math.abs(px) + Math.abs(py) + Math.abs(vx) + Math.abs(vy) + Math.abs(rot + 4) > 0.05;
      raf = dragging || moving ? requestAnimationFrame(tick) : null;
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };
    polaroid.addEventListener("pointerdown", function (e) {
      dragging = true;
      polaroid.setPointerCapture(e.pointerId);
      grabX = e.clientX - px; grabY = e.clientY - py;
      lastX = e.clientX; lastY = e.clientY;
      polaroid.classList.add("is-dragging");
      kick();
    });
    polaroid.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      vx = e.clientX - lastX; vy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      px = e.clientX - grabX; py = e.clientY - grabY;
    });
    var release = function () { dragging = false; polaroid.classList.remove("is-dragging"); kick(); };
    polaroid.addEventListener("pointerup", release);
    polaroid.addEventListener("pointercancel", release);
    /* One small nudge on load so people notice it moves */
    setTimeout(function () { if (!dragging) { vx = 7; kick(); } }, 1600);
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

  /* Headline letters duck away from the cursor and spring back */
  var springy = document.getElementById("springy");
  if (springy && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    springy.setAttribute("aria-label", springy.innerText.replace(/\s+/g, " ").trim());
    var chars = [];
    var split = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split("").forEach(function (c) {
            var span = document.createElement("span");
            span.className = "ch";
            span.setAttribute("aria-hidden", "true");
            span.textContent = c;
            frag.appendChild(span);
            chars.push({ el: span, y: 0, r: 0, vy: 0, vr: 0 });
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          split(child);
        }
      });
    };
    split(springy);
    var cursor = null, loop = null;
    var step = function () {
      var busy = false;
      chars.forEach(function (c) {
        var push = 0, spin = 0;
        if (cursor) {
          var box = c.el.getBoundingClientRect();
          var dx = box.left + box.width / 2 - cursor.x, dy = box.top + box.height / 2 - cursor.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) { var k = 1 - d / 140; push = (dy > 0 ? 1 : -1) * k * 26; spin = (dx > 0 ? 1 : -1) * k * 14; }
        }
        c.vy = (c.vy + (push - c.y) * 0.16) * 0.72;
        c.vr = (c.vr + (spin - c.r) * 0.16) * 0.72;
        c.y += c.vy; c.r += c.vr;
        if (Math.abs(c.y) + Math.abs(c.vy) + Math.abs(c.r) > 0.05) busy = true;
        c.el.style.transform = "translateY(" + c.y.toFixed(2) + "px) rotate(" + c.r.toFixed(2) + "deg)";
      });
      loop = busy || cursor ? requestAnimationFrame(step) : null;
    };
    var hero = springy.closest(".hero") || springy;
    hero.addEventListener("pointermove", function (e) {
      cursor = { x: e.clientX, y: e.clientY };
      if (!loop) loop = requestAnimationFrame(step);
    });
    hero.addEventListener("pointerleave", function () {
      cursor = null;
      if (!loop) loop = requestAnimationFrame(step);
    });
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
  var counters = document.querySelectorAll(".stat-num, .result-card .num, .callout-stat .num");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        var el = entry.target;
        var match = el.textContent.match(/^(\D*)(\d+)(.*)$/);
        if (!match) return;
        var target = +match[2], start = null;
        var step = function (t) {
          if (start === null) start = t;
          var k = Math.min((t - start) / 1100, 1);
          el.textContent = match[1] + Math.round(target * (1 - Math.pow(1 - k, 3))) + match[3];
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        /* If the browser pauses animation frames, still land on the real number */
        setTimeout(function () { el.textContent = match[1] + target + match[3]; }, 1400);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
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
