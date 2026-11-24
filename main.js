/* SpinVerse Social Casino — shared scripts */
(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "✕" : "☰";
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      })
    );
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Virtual coin balance ---------- */
  const BAL_KEY = "sv_coins";
  const START = 10000;
  function getBalance() {
    let v = NaN;
    try { v = parseInt(localStorage.getItem(BAL_KEY), 10); } catch (e) {}
    return Number.isFinite(v) ? v : START;
  }
  function setBalance(v) {
    try { localStorage.setItem(BAL_KEY, String(v)); } catch (e) {}
    document.querySelectorAll("[data-balance]").forEach((el) => (el.textContent = v.toLocaleString()));
  }
  setBalance(getBalance());

  /* ---------- Daily bonus ---------- */
  const BONUS_KEY = "sv_bonus_day";
  document.querySelectorAll("[data-claim-bonus]").forEach((btn) => {
    const today = new Date().toDateString();
    const markClaimed = () => { btn.textContent = "✓ Claimed — come back tomorrow"; btn.disabled = true; };
    let claimed = false;
    try { claimed = localStorage.getItem(BONUS_KEY) === today; } catch (e) {}
    if (claimed) markClaimed();
    btn.addEventListener("click", () => {
      setBalance(getBalance() + 5000);
      try { localStorage.setItem(BONUS_KEY, today); } catch (e) {}
      markClaimed();
      const msg = document.querySelector(".slot-msg");
      if (msg) { msg.textContent = "🎁 +5,000 free coins added to your balance!"; msg.classList.add("win"); }
    });
  });

  /* ---------- Demo slot machine ---------- */
  const slot = document.querySelector(".slot");
  if (slot) {
    const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "🍀", "💎", "7️⃣"];
    const PAYOUT = { "🍒": 5, "🍋": 8, "🔔": 10, "⭐": 15, "🍀": 20, "💎": 40, "7️⃣": 100 };
    const BETS = [50, 100, 250, 500, 1000];
    let betIdx = 1;
    let spinning = false;

    const reels = [...slot.querySelectorAll(".reel")];
    const spinBtn = slot.querySelector("[data-spin]");
    const betOut = slot.querySelector("[data-bet]");
    const msg = slot.querySelector(".slot-msg");
    const rand = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    // Initial symbols
    reels.forEach((r) => { r.querySelector(".reel-strip").innerHTML = `<div>${rand()}</div>`; });

    const renderBet = () => { betOut.textContent = BETS[betIdx]; };
    slot.querySelector("[data-bet-down]").addEventListener("click", () => { if (betIdx > 0 && !spinning) { betIdx--; renderBet(); } });
    slot.querySelector("[data-bet-up]").addEventListener("click", () => { if (betIdx < BETS.length - 1 && !spinning) { betIdx++; renderBet(); } });
    renderBet();

    function spinReel(reel, finalSym, duration) {
      return new Promise((resolve) => {
        const strip = reel.querySelector(".reel-strip");
        const h = reel.clientHeight;
        const current = strip.lastElementChild ? strip.lastElementChild.textContent : rand();
        const count = 18 + Math.floor(Math.random() * 6);
        let html = `<div>${current}</div>`;
        for (let i = 0; i < count; i++) html += `<div>${rand()}</div>`;
        html += `<div>${finalSym}</div>`;
        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";
        strip.innerHTML = html;
        void strip.offsetHeight; // force reflow
        strip.style.transition = `transform ${duration}ms cubic-bezier(.15,.85,.25,1.02)`;
        strip.style.transform = `translateY(-${(count + 1) * h}px)`;
        setTimeout(() => {
          strip.style.transition = "none";
          strip.style.transform = "translateY(0)";
          strip.innerHTML = `<div>${finalSym}</div>`;
          resolve();
        }, duration + 30);
      });
    }

    spinBtn.addEventListener("click", async () => {
      if (spinning) return;
      const bet = BETS[betIdx];
      let bal = getBalance();
      if (bal < bet) {
        msg.textContent = "Not enough coins — claim your free daily bonus below!";
        msg.classList.remove("win");
        return;
      }
      spinning = true;
      spinBtn.disabled = true;
      setBalance((bal -= bet));
      msg.textContent = "Spinning…";
      msg.classList.remove("win");
      reels.forEach((r) => r.classList.remove("win"));

      const result = [rand(), rand(), rand()];
      await Promise.all(reels.map((r, i) => spinReel(r, result[i], 1400 + i * 450)));

      let win = 0;
      if (result[0] === result[1] && result[1] === result[2]) {
        win = bet * PAYOUT[result[0]];
        reels.forEach((r) => r.classList.add("win"));
        msg.textContent = `🎉 JACKPOT! Three ${result[0]} — you won ${win.toLocaleString()} coins!`;
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        win = bet * 2;
        msg.textContent = `Nice! A pair — +${win.toLocaleString()} coins`;
      } else {
        msg.textContent = "No win this time. Spin again!";
      }
      if (win) { setBalance(getBalance() + win); msg.classList.add("win"); }
      spinning = false;
      spinBtn.disabled = false;
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    const rules = {
      name: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      topic: (v) => v !== "",
      message: (v) => v.trim().length >= 10,
      consent: (_, el) => el.checked,
    };
    const validate = (el) => {
      const rule = rules[el.name];
      if (!rule) return true;
      const ok = rule(el.value, el);
      const field = el.closest(".field") || el.closest(".check");
      if (field) field.classList.toggle("invalid", !ok);
      return ok;
    };
    form.querySelectorAll("input, select, textarea").forEach((el) => {
      el.addEventListener("blur", () => validate(el));
      el.addEventListener("input", () => {
        const f = el.closest(".field");
        if (f && f.classList.contains("invalid")) validate(el);
      });
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const els = [...form.querySelectorAll("input, select, textarea")];
      const results = els.map(validate);
      if (results.includes(false)) {
        const first = els[results.indexOf(false)];
        first.focus();
        return;
      }
      // NOTE: No backend is connected. Hook this up to your email service / API endpoint.
      form.style.display = "none";
      document.querySelector(".form-success").classList.add("show");
    });
  }
})();
