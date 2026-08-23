(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width: 980px)");

  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menuBtn");

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("open")) return;
      if (nav.contains(e.target) || menuBtn.contains(e.target)) return;
      setMenu(false);
    });
    mobile.addEventListener("change", function (ev) {
      if (!ev.matches) setMenu(false);
    });
  }

  var links = Array.from(document.querySelectorAll(".nav a[href^='#']"));
  var sections = links
    .map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    })
    .filter(Boolean);

  function spy() {
    if (!sections.length) return;
    var y = window.scrollY + 96;
    var first = sections[0];
    if (!first || y < first.offsetTop - 40) {
      links.forEach(function (a) {
        a.classList.remove("is-active");
        a.removeAttribute("aria-current");
      });
      return;
    }
    var current = first;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= y) current = sec;
    });
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  var form = document.getElementById("form");
  var note = document.getElementById("formNote");
  if (form) {
    var submitButton = form.querySelector("button[type='submit']");
    var submitLabel = submitButton ? submitButton.querySelector("span") : null;

    function setFormState(kind, message) {
      if (!note) return;
      note.textContent = message;
      note.classList.toggle("form-ok", kind === "ok");
      note.classList.toggle("form-error", kind === "error");
      note.classList.toggle("form-pending", kind === "pending");
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var endpoint = String(form.dataset.endpoint || "").trim();
      if (!endpoint) {
        setFormState("error", "接收邮箱尚未配置，当前无法在线发送。请先填写并激活表单接收接口。");
        return;
      }
      if (!/^https:\/\//i.test(endpoint)) {
        setFormState("error", "表单接口配置无效：只允许使用 HTTPS 接收地址。");
        return;
      }

      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var phone = String(data.get("phone") || "").trim();
      var organization = String(data.get("organization") || "").trim();
      var email = String(data.get("email") || "").trim();
      var cooperation = String(data.get("cooperation") || "").trim();
      var message = String(data.get("message") || "").trim();
      var honeypot = String(data.get("website") || "").trim();

      if (honeypot) {
        form.reset();
        setFormState("ok", "合作邀请已提交，我们会尽快查看。");
        return;
      }

      var payload = {
        _subject: "芯电感-E 官网合作邀请｜" + cooperation,
        _template: "table",
        name: name,
        organization: organization,
        phone: phone,
        email: email,
        cooperation: cooperation,
        message: message,
        source: window.location.href
      };

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "正在发送…";
      setFormState("", "正在安全发送合作邀请，请稍候。");

      try {
        var response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });
        var result = await response.json().catch(function () { return {}; });
        var successful = result.success === true || String(result.success).toLowerCase() === "true";
        var serviceMessage = String(result.message || "");
        if (!successful && /needs activation|activate form/i.test(serviceMessage)) {
          setFormState("pending", "接收邮箱尚待激活。确认邮件已发送至项目负责人邮箱，请点击 Activate Form 后再提交。");
          return;
        }
        if (!response.ok || !successful) {
          throw new Error(result.message || "发送服务暂时不可用");
        }
        form.reset();
        setFormState("ok", "合作邀请已成功发送。项目负责人收到后会通过你填写的电话或邮箱联系。 ");
      } catch (error) {
        setFormState("error", "发送失败，请检查网络后重试。你的填写内容仍保留，未显示成功就不代表已经送达。");
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "提交合作邀请";
      }
    });
  }

  var hidden = false;
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
  });

  function drawWave(svg, kind) {
    if (!svg) return;
    var ns = "http://www.w3.org/2000/svg";
    var path = document.createElementNS(ns, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#c45c26");
    path.setAttribute("stroke-width", "1.6");
    svg.appendChild(path);
    var base = document.createElementNS(ns, "path");
    base.setAttribute("fill", "none");
    base.setAttribute("stroke", "rgba(243,238,230,0.16)");
    base.setAttribute("stroke-width", "1");
    base.setAttribute("d", "M0 70 H360");
    svg.appendChild(base);
    var t = 0;
    function frame() {
      if (hidden || reduce) return;
      t += 0.045;
      var d = "M0 70";
      for (var x = 0; x <= 360; x += 4) {
        var y;
        if (kind === "R") {
          var drift = 18 * Math.sin(x / 90 + t) + 8 * Math.sin(x / 28 + t * 0.6);
          y = 62 + drift * (0.35 + 0.08 * Math.sin(t / 4));
        } else {
          var spike = Math.exp(-Math.pow(((x + t * 40) % 120) - 18, 2) / 40);
          y = 70 - spike * 46 - 4 * Math.sin(x / 18 + t * 2);
        }
        d += " L" + x + " " + y.toFixed(2);
      }
      path.setAttribute("d", d);
      requestAnimationFrame(frame);
    }
    if (reduce) {
      path.setAttribute("d", "M0 70 L360 70");
      return;
    }
    frame();
  }
  drawWave(document.getElementById("waveR"), "R");
  drawWave(document.getElementById("waveV"), "V");

  var canvas = document.getElementById("lattice");
  if (!canvas || !canvas.getContext) return;
  if (reduce || mobile.matches) {
    canvas.style.display = "none";
    return;
  }

  var ctx = canvas.getContext("2d");
  var nodes = [];
  var COUNT = 36;
  var running = true;
  var resizeTimer;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  for (var i = 0; i < COUNT; i++) {
    nodes.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00022,
      vy: (Math.random() - 0.5) * 0.00022
    });
  }

  function tick() {
    if (!running || hidden) {
      requestAnimationFrame(tick);
      return;
    }
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    nodes.forEach(function (n) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > 1) n.vx *= -1;
      if (n.y < 0 || n.y > 1) n.vy *= -1;
    });
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var ax = a.x * w;
      var ay = a.y * h;
      ctx.fillStyle = "rgba(196,92,38,0.55)";
      ctx.beginPath();
      ctx.arc(ax, ay, 1.2, 0, Math.PI * 2);
      ctx.fill();
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.16) {
          ctx.strokeStyle = "rgba(196,92,38," + (0.18 * (1 - dist / 0.16)).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
  });
  tick();
})();
