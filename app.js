(function () {
  var track = document.getElementById("story-track");
  var viewport = document.getElementById("carousel-viewport");
  var prevBtn = document.getElementById("carousel-prev");
  var nextBtn = document.getElementById("carousel-next");
  var dotsWrap = document.getElementById("carousel-dots");

  if (!track || !viewport || !Array.isArray(stories)) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fragment = document.createDocumentFragment();
  var dotsFragment = document.createDocumentFragment();
  var currentIndex = 0;
  var animFrame = null;

  stories.forEach(function (story, index) {
    var isOpen = story.status === "aberto";
    var li = document.createElement("li");
    li.className = "story-item";
    li.setAttribute("data-index", String(index));

    var card;
    if (isOpen) {
      card = document.createElement("a");
      card.href = story.url || "#";
      card.target = "_self";
      card.rel = "noopener";
      card.className = "story-card";
      card.setAttribute("aria-label", story.title + ". Abrir história.");
    } else {
      card = document.createElement("div");
      card.className = "story-card is-soon";
      card.setAttribute("aria-disabled", "true");
      card.setAttribute(
        "aria-label",
        story.title + ". Em breve, indisponível."
      );
    }

    var media = document.createElement("div");
    media.className = "story-media";

    var cover = document.createElement("img");
    cover.className = "story-cover";
    cover.src = story.cover;
    cover.alt = "";
    cover.decoding = "async";
    cover.loading = index === 0 ? "eager" : "lazy";

    var thumbWrap = document.createElement("div");
    thumbWrap.className = "story-thumb";
    var thumb = document.createElement("img");
    thumb.src = story.thumb;
    thumb.alt = "";
    thumb.decoding = "async";
    thumb.loading = index === 0 ? "eager" : "lazy";
    thumbWrap.appendChild(thumb);

    media.appendChild(cover);
    media.appendChild(thumbWrap);

    var body = document.createElement("div");
    body.className = "story-body";

    var status = document.createElement("span");
    status.className = "story-status";
    status.textContent = isOpen ? "Aberto" : "Em breve";

    var title = document.createElement("h2");
    title.className = "story-title";
    title.textContent = story.title;

    var blurb = document.createElement("p");
    blurb.className = "story-blurb";
    blurb.textContent = story.blurb;

    body.appendChild(status);
    body.appendChild(title);
    body.appendChild(blurb);

    card.appendChild(media);
    card.appendChild(body);
    li.appendChild(card);
    fragment.appendChild(li);

    if (dotsWrap) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Ir para " + story.title);
      dot.setAttribute("data-index", String(index));
      dotsFragment.appendChild(dot);
    }
  });

  track.appendChild(fragment);
  if (dotsWrap) dotsWrap.appendChild(dotsFragment);

  var items = track.querySelectorAll(".story-item");
  var dots = dotsWrap ? dotsWrap.querySelectorAll(".carousel-dot") : [];
  var total = items.length;

  function wrap(index) {
    if (total === 0) return 0;
    return ((index % total) + total) % total;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function updateActive(index) {
    currentIndex = index;
    for (var i = 0; i < items.length; i++) {
      var active = i === currentIndex;
      items[i].classList.toggle("is-active", active);
      if (dots[i]) {
        dots[i].classList.toggle("is-active", active);
        dots[i].setAttribute("aria-selected", active ? "true" : "false");
      }
    }
  }

  function targetScrollLeft(index) {
    var item = items[index];
    if (!item) return 0;
    var itemCenter = item.offsetLeft + item.offsetWidth / 2;
    return itemCenter - viewport.clientWidth / 2;
  }

  function animateScrollTo(to, duration) {
    if (animFrame) window.cancelAnimationFrame(animFrame);

    if (reduceMotion || duration <= 0) {
      viewport.scrollLeft = to;
      return;
    }

    var from = viewport.scrollLeft;
    var delta = to - from;
    if (Math.abs(delta) < 1) {
      viewport.scrollLeft = to;
      return;
    }

    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      viewport.scrollLeft = from + delta * easeInOutCubic(progress);
      if (progress < 1) {
        animFrame = window.requestAnimationFrame(step);
      } else {
        animFrame = null;
      }
    }

    animFrame = window.requestAnimationFrame(step);
  }

  function goTo(index, instant) {
    var next = wrap(index);
    updateActive(next);
    animateScrollTo(targetScrollLeft(next), instant ? 0 : 620);
  }

  function nearestIndex() {
    var viewportRect = viewport.getBoundingClientRect();
    var center = viewportRect.left + viewportRect.width / 2;
    var best = 0;
    var bestDist = Infinity;

    for (var i = 0; i < items.length; i++) {
      var rect = items[i].getBoundingClientRect();
      var itemCenter = rect.left + rect.width / 2;
      var dist = Math.abs(itemCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    return best;
  }

  if (prevBtn) {
    prevBtn.disabled = false;
    prevBtn.addEventListener("click", function () {
      goTo(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.addEventListener("click", function () {
      goTo(currentIndex + 1);
    });
  }

  if (dotsWrap) {
    dotsWrap.addEventListener("click", function (event) {
      var btn = event.target.closest(".carousel-dot");
      if (!btn) return;
      goTo(Number(btn.getAttribute("data-index")));
    });
  }

  var scrollTimer = null;
  viewport.addEventListener("scroll", function () {
    if (animFrame) return;
    if (scrollTimer) window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(function () {
      var nearest = nearestIndex();
      if (nearest !== currentIndex) updateActive(nearest);
      animateScrollTo(targetScrollLeft(nearest), 420);
    }, 90);
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      goTo(currentIndex - 1);
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      goTo(currentIndex + 1);
    }
  });

  window.addEventListener("resize", function () {
    goTo(currentIndex, true);
  });

  goTo(0, true);
})();
