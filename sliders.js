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
        mount: null
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
            '    <div class="sliders-title">How are you feeling?</div>' +
            '    <div class="sliders-pill" id="sliders-pill"></div>' +
            '  </div>' +
            '  <div class="sliders-divider"></div>' +
            '  <div class="slider-row">' +
            '    <div class="slider-labels">' +
            '      <span class="slider-label">Energy Level</span>' +
            '      <span class="slider-ends">Drained - Energized</span>' +
            '    </div>' +
            '    <input class="slider-input" type="range" min="1" max="10" value="5" data-name="energy" />' +
            '  </div>' +
            '  <div class="slider-row">' +
            '    <div class="slider-labels">' +
            '      <span class="slider-label">Overall Feeling</span>' +
            '      <span class="slider-ends">Low - Bright</span>' +
            '    </div>' +
            '    <input class="slider-input" type="range" min="1" max="10" value="5" data-name="mood" />' +
            '  </div>' +
            '  <div class="slider-row">' +
            '    <div class="slider-labels">' +
            '      <span class="slider-label">Stress Level</span>' +
            '      <span class="slider-ends">Calm - Overwhelmed</span>' +
            '    </div>' +
            '    <input class="slider-input" type="range" min="1" max="10" value="5" data-name="stress" />' +
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

    function computeMood(energy, stress, mood) {
        var score = (energy * 0.30) + ((11 - stress) * 0.30) + (mood * 0.40);
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
        if (!state.inputs.energy || !state.inputs.stress || !state.inputs.mood) return;

        var energy = parseFloat(state.inputs.energy.value);
        var stress = parseFloat(state.inputs.stress.value);
        var mood = parseFloat(state.inputs.mood.value);
        var label = computeMood(energy, stress, mood);
        var meta = MOOD_META[label] || MOOD_META.Okay;

        updatePill(label);
        Object.keys(state.inputs).forEach(function (key) {
            setTrackFill(state.inputs[key], meta.color);
        });

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

        document.addEventListener('sliders:manual', onManualEvent);
        document.addEventListener('sliders:reset', onResetEvent);
    }

    function unbindEvents() {
        Object.keys(state.inputs).forEach(function (key) {
            state.inputs[key].removeEventListener('input', updateFromSliders);
        });
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
