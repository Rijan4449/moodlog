(function () {
    'use strict';

    var MOOD_META = {
        Great: { emoji: '🌟', color: '#E88C8C', bg: '#E88C8C22' },
        Good: { emoji: '😊', color: '#E8A87C', bg: '#E8A87C22' },
        Okay: { emoji: '😐', color: '#F5D08A', bg: '#F5D08A22' },
        Bad: { emoji: '😔', color: '#A8C5A0', bg: '#A8C5A022' },
        Awful: { emoji: '😞', color: '#B8A9D4', bg: '#B8A9D422' }
    };

    var state = {
        initialized: false,
        inputs: {},
        card: null,
        pill: null,
        manualNote: null,
        resetLink: null,
        mount: null,
        infoBtn: null,
        tooltip: null,
        tooltipOpen: false,
        plotDot: null,
        infoClickHandler: null,
        docClickHandler: null,
        docKeyHandler: null
    };

    function ensureMount() {
        var mount = document.getElementById('sliders-mount');
        if (!mount) return null;
        state.mount = mount;
        return mount;
    }

    function buildWidget() {
        var mount = ensureMount();
        if (!mount) return;

        mount.innerHTML =
            '<div class="sliders-card" id="sliders-card">' +
            '  <div class="sliders-header">' +
            '    <div class="sliders-title-wrap">' +
            '      <div class="sliders-title">How are you feeling?</div>' +
            '      <button class="sliders-info-btn" id="sliders-info-btn" type="button" aria-label="About the Circumplex Model" aria-expanded="false">ⓘ</button>' +
            '      <div class="sliders-tooltip" id="sliders-tooltip" role="tooltip">' +
            '        Based on Russell\'s Circumplex Model of Affect (1980) — a foundational framework in affective psychology that maps all human emotions across two dimensions: Valence (pleasant ↔ unpleasant) and Arousal (activated ↔ deactivated).' +
            '      </div>' +
            '    </div>' +
            '    <div class="sliders-pill" id="sliders-pill"></div>' +
            '  </div>' +
            '  <div class="sliders-divider"></div>' +
            '  <div class="slider-row">' +
            '    <div class="slider-labels">' +
            '      <div class="slider-copy">' +
            '        <span class="slider-label">Valence</span>' +
            '        <span class="slider-subtitle">How positive or negative does this feel?</span>' +
            '      </div>' +
            '      <div class="slider-ends">' +
            '        <span class="slider-end"><span class="slider-emoji">😞</span><span class="slider-end-label">Negative</span></span>' +
            '        <span class="slider-end"><span class="slider-emoji">😊</span><span class="slider-end-label">Positive</span></span>' +
            '      </div>' +
            '    </div>' +
            '    <input class="slider-input" type="range" min="1" max="10" value="5" data-name="valence" />' +
            '  </div>' +
            '  <div class="slider-row">' +
            '    <div class="slider-labels">' +
            '      <div class="slider-copy">' +
            '        <span class="slider-label">Arousal</span>' +
            '        <span class="slider-subtitle">How activated or energized do you feel?</span>' +
            '      </div>' +
            '      <div class="slider-ends">' +
            '        <span class="slider-end"><span class="slider-emoji">😴</span><span class="slider-end-label">Low energy</span></span>' +
            '        <span class="slider-end"><span class="slider-emoji">⚡</span><span class="slider-end-label">High energy</span></span>' +
            '      </div>' +
            '    </div>' +
            '    <input class="slider-input" type="range" min="1" max="10" value="5" data-name="arousal" />' +
            '  </div>' +
            '  <div class="slider-row">' +
            '    <div class="slider-labels">' +
            '      <div class="slider-copy">' +
            '        <span class="slider-label">Dominance</span>' +
            '        <span class="slider-subtitle">How in control do you feel right now?</span>' +
            '      </div>' +
            '      <div class="slider-ends">' +
            '        <span class="slider-end"><span class="slider-emoji">🌊</span><span class="slider-end-label">Overwhelmed</span></span>' +
            '        <span class="slider-end"><span class="slider-emoji">🧭</span><span class="slider-end-label">In control</span></span>' +
            '      </div>' +
            '    </div>' +
            '    <input class="slider-input" type="range" min="1" max="10" value="5" data-name="dominance" />' +
            '  </div>' +
            '  <div class="circumplex-plot" id="circumplex-plot">' +
            '    <svg viewBox="0 0 200 200" role="img" aria-label="Circumplex plot">' +
            '      <line class="plot-axis" x1="100" y1="20" x2="100" y2="180" />' +
            '      <line class="plot-axis" x1="20" y1="100" x2="180" y2="100" />' +
            '      <text class="plot-axis-label" x="22" y="104" text-anchor="start">−</text>' +
            '      <text class="plot-axis-label" x="178" y="104" text-anchor="end">+</text>' +
            '      <text class="plot-axis-label" x="100" y="18" text-anchor="middle">↑ Active</text>' +
            '      <text class="plot-axis-label" x="100" y="194" text-anchor="middle">↓ Calm</text>' +
            '      <text class="plot-quadrant" x="28" y="36" text-anchor="start">Tense / Stressed</text>' +
            '      <text class="plot-quadrant" x="172" y="36" text-anchor="end">Excited / Alert</text>' +
            '      <text class="plot-quadrant" x="28" y="184" text-anchor="start">Sad / Depressed</text>' +
            '      <text class="plot-quadrant" x="172" y="184" text-anchor="end">Calm / Relaxed</text>' +
            '      <circle class="plot-dot" id="plot-dot" cx="100" cy="100" r="6"></circle>' +
            '    </svg>' +
            '  </div>' +
            '</div>' +
            '<div class="sliders-manual" id="sliders-manual">' +
            '  <span>Using your manual selection</span>' +
            '  <button type="button" id="sliders-reset">Reset to sliders</button>' +
            '</div>';

        state.card = mount.querySelector('#sliders-card');
        state.pill = mount.querySelector('#sliders-pill');
        state.manualNote = mount.querySelector('#sliders-manual');
        state.resetLink = mount.querySelector('#sliders-reset');
        state.infoBtn = mount.querySelector('#sliders-info-btn');
        state.tooltip = mount.querySelector('#sliders-tooltip');
        state.plotDot = mount.querySelector('#plot-dot');

        var inputs = mount.querySelectorAll('.slider-input');
        inputs.forEach(function (input) {
            state.inputs[input.dataset.name] = input;
        });
    }

    function setTrackFill(input, color) {
        var min = parseFloat(input.min || '1');
        var max = parseFloat(input.max || '10');
        var val = parseFloat(input.value || '5');
        var pct = ((val - min) / (max - min)) * 100;
        input.style.setProperty('--slider-fill', color);
        input.style.setProperty('--slider-track', 'var(--border)');
        input.style.setProperty('--slider-pct', pct + '%');
    }

    function setTooltipOpen(isOpen) {
        if (!state.tooltip || !state.infoBtn) return;
        state.tooltipOpen = isOpen;
        state.tooltip.classList.toggle('is-visible', isOpen);
        state.infoBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function updatePlot(valence, arousal, dominance, color) {
        if (!state.plotDot) return;
        var v = (valence - 1) / 9;
        var a = (arousal - 1) / 9;
        var pad = 20;
        var size = 200 - (pad * 2);
        var x = pad + (v * size);
        var y = pad + ((1 - a) * size);
        var r = 6 + ((dominance - 1) / 9) * 6;

        state.plotDot.setAttribute('cx', x.toFixed(2));
        state.plotDot.setAttribute('cy', y.toFixed(2));
        state.plotDot.setAttribute('r', r.toFixed(2));
        state.plotDot.style.color = color;
    }

    function computeMood(valence, arousal, dominance) {
        var score = (valence * 0.45) + (arousal * 0.30) + (dominance * 0.25);
        if (score >= 8.5) return 'Great';
        if (score >= 6.5) return 'Good';
        if (score >= 4.5) return 'Okay';
        if (score >= 2.5) return 'Bad';
        return 'Awful';
    }

    function updatePill(label) {
        var meta = MOOD_META[label] || MOOD_META.Okay;
        if (!state.pill) return;
        state.pill.textContent = meta.emoji + ' ' + label;
        state.pill.style.setProperty('--pill-bg', meta.bg);
        state.pill.style.setProperty('--pill-color', meta.color);
    }

    function updateFromSliders() {
        if (!state.inputs.valence || !state.inputs.arousal || !state.inputs.dominance) return;

        var valence = parseFloat(state.inputs.valence.value);
        var arousal = parseFloat(state.inputs.arousal.value);
        var dominance = parseFloat(state.inputs.dominance.value);
        var label = computeMood(valence, arousal, dominance);
        var meta = MOOD_META[label] || MOOD_META.Okay;

        updatePill(label);
        Object.keys(state.inputs).forEach(function (key) {
            setTrackFill(state.inputs[key], meta.color);
        });

        updatePlot(valence, arousal, dominance, meta.color);

        if (window.moodState && window.moodState.manuallySelected) {
            return;
        }

        if (typeof window.setDetectedEmotion === 'function') {
            window.setDetectedEmotion(label);
        }
    }

    function setDisabled(isDisabled) {
        if (!state.card) return;
        state.card.classList.toggle('sliders-disabled', isDisabled);
        if (state.manualNote) {
            state.manualNote.style.display = isDisabled ? 'flex' : 'none';
        }
        Object.keys(state.inputs).forEach(function (key) {
            state.inputs[key].disabled = isDisabled;
        });
    }

    function resetSliders() {
        Object.keys(state.inputs).forEach(function (key) {
            state.inputs[key].value = 5;
        });
        if (window.moodState) {
            window.moodState.manuallySelected = false;
        }
        setDisabled(false);
        updateFromSliders();
    }

    function onManualEvent() {
        setDisabled(true);
    }

    function onResetEvent() {
        resetSliders();
    }

    function bindEvents() {
        Object.keys(state.inputs).forEach(function (key) {
            state.inputs[key].addEventListener('input', updateFromSliders);
        });

        if (state.resetLink) {
            state.resetLink.addEventListener('click', function () {
                resetSliders();
            });
        }

        if (state.infoBtn) {
            state.infoClickHandler = function (event) {
                event.stopPropagation();
                setTooltipOpen(!state.tooltipOpen);
            };
            state.infoBtn.addEventListener('click', state.infoClickHandler);
        }

        state.docClickHandler = function (event) {
            if (!state.tooltipOpen) return;
            if (state.tooltip && state.tooltip.contains(event.target)) return;
            if (state.infoBtn && state.infoBtn.contains(event.target)) return;
            setTooltipOpen(false);
        };

        state.docKeyHandler = function (event) {
            if (event.key === 'Escape') {
                setTooltipOpen(false);
            }
        };

        document.addEventListener('click', state.docClickHandler);
        document.addEventListener('keydown', state.docKeyHandler);

        document.addEventListener('sliders:manual', onManualEvent);
        document.addEventListener('sliders:reset', onResetEvent);
    }

    function unbindEvents() {
        Object.keys(state.inputs).forEach(function (key) {
            state.inputs[key].removeEventListener('input', updateFromSliders);
        });
        if (state.infoBtn && state.infoClickHandler) {
            state.infoBtn.removeEventListener('click', state.infoClickHandler);
        }
        if (state.docClickHandler) {
            document.removeEventListener('click', state.docClickHandler);
        }
        if (state.docKeyHandler) {
            document.removeEventListener('keydown', state.docKeyHandler);
        }
        document.removeEventListener('sliders:manual', onManualEvent);
        document.removeEventListener('sliders:reset', onResetEvent);
    }

    function init() {
        if (!ensureMount()) return;
        if (!state.card) {
            buildWidget();
        }
        if (state.initialized) return;
        state.initialized = true;
        bindEvents();
        resetSliders();
    }

    function destroy() {
        if (!state.initialized) return;
        state.initialized = false;
        unbindEvents();
    }

    window.guidedSliders = {
        init: init,
        destroy: destroy
    };
})();
