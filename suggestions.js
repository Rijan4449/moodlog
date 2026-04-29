(function () {
    'use strict';

    var SUGGESTIONS = {
        Great: [
            { category: 'music', icon: '🎵', label: 'Keep the energy up', action: 'Play an upbeat playlist' },
            { category: 'music', icon: '🎵', label: 'Share the mood', action: 'Make a feel-good mix for a friend' },
            { category: 'activity', icon: '🏃', label: 'Ride the wave', action: 'Go for a run or workout' },
            { category: 'activity', icon: '✍️', label: 'Capture this moment', action: 'Write down 3 things making you happy' },
            { category: 'social', icon: '💬', label: 'Spread it', action: 'Call or text someone you care about' },
            { category: 'mindful', icon: '🌿', label: 'Stay grounded', action: 'Take a short walk outside' }
        ],
        Good: [
            { category: 'music', icon: '🎵', label: 'Match the vibe', action: 'Play some chill indie or lo-fi' },
            { category: 'music', icon: '🎵', label: 'Wind down gently', action: 'Try an acoustic or soft pop playlist' },
            { category: 'activity', icon: '📚', label: 'Channel the focus', action: 'Read for 20 minutes' },
            { category: 'activity', icon: '🎨', label: 'Make something', action: 'Sketch, doodle, or journal freely' },
            { category: 'social', icon: '☕', label: 'Connect lightly', action: 'Grab a coffee with someone' },
            { category: 'mindful', icon: '🧘', label: 'Maintain the balance', action: 'Do a 5-minute breathing exercise' }
        ],
        Okay: [
            { category: 'music', icon: '🎵', label: 'Shift the energy', action: 'Play something uplifting or nostalgic' },
            { category: 'music', icon: '🎵', label: 'Background comfort', action: 'Try a cozy ambient or study playlist' },
            { category: 'activity', icon: '🚶', label: 'Break the stillness', action: 'Take a 10-minute walk' },
            { category: 'activity', icon: '🍵', label: 'Reset with a ritual', action: 'Make tea or coffee mindfully' },
            { category: 'social', icon: '💬', label: 'Light check-in', action: 'Send a meme or voice note to a friend' },
            { category: 'mindful', icon: '📓', label: "Name what's flat", action: 'Write 3 sentences about how you actually feel' }
        ],
        Bad: [
            { category: 'music', icon: '🎵', label: 'Let it out', action: 'Play music that matches how you feel first' },
            { category: 'music', icon: '🎵', label: 'Gentle lift', action: 'Try a calming or hopeful playlist' },
            { category: 'activity', icon: '🛁', label: 'Be kind to your body', action: 'Take a warm shower or stretch slowly' },
            { category: 'activity', icon: '🌱', label: 'One small thing', action: 'Do one tiny productive task, then rest' },
            { category: 'social', icon: '🤍', label: 'Reach out', action: "Tell someone you trust how you're feeling" },
            { category: 'mindful', icon: '🫁', label: 'Ground yourself', action: 'Try box breathing: 4 in, 4 hold, 4 out' }
        ],
        Awful: [
            { category: 'music', icon: '🎵', label: 'Comfort sounds', action: 'Play something soft and familiar' },
            { category: 'music', icon: '🎵', label: 'Distract gently', action: 'Put on a familiar album or movie soundtrack' },
            { category: 'activity', icon: '🛌', label: 'Rest is valid', action: 'Lie down and do absolutely nothing for 10 min' },
            { category: 'activity', icon: '💧', label: 'Basic care first', action: 'Drink water, eat something small' },
            { category: 'social', icon: '🤝', label: "You don't have to alone", action: 'Text or call someone — even just to talk' },
            { category: 'mindful', icon: '🫂', label: 'Be gentle with yourself', action: 'Remind yourself: this feeling is temporary' }
        ]
    };

    var TITLE_MAP = {
        Great: "You're doing great \ud83c\udf1f",
        Good: 'Nice, keep it going',
        Okay: "Here's a little nudge",
        Bad: "Let's take care of you",
        Awful: "You're not alone"
    };

    var MOOD_COLORS = {
        Great: '#E88C8C',
        Good: '#E8A87C',
        Okay: '#F5D08A',
        Bad: '#A8C5A0',
        Awful: '#B8A9D4'
    };

    var state = {
        lastKeys: [],
        activeMood: null
    };

    var els = {
        root: null,
        overlay: null,
        modal: null,
        emoji: null,
        title: null,
        subtitle: null,
        list: null,
        primary: null,
        reroll: null
    };

    function ensureRoot() {
        var root = document.getElementById('suggestions-modal-root');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'suggestions-modal-root';
        document.body.appendChild(root);
        return root;
    }

    function buildModal() {
        if (els.overlay) return;
        var root = ensureRoot();
        root.innerHTML =
            '<div class="suggestions-overlay" id="suggestions-overlay">' +
            '  <div class="suggestions-modal" role="dialog" aria-modal="true">' +
            '    <div class="suggestions-header">' +
            '      <div class="suggestions-emoji" aria-hidden="true"></div>' +
            '      <h3 class="suggestions-title"></h3>' +
            '      <p class="suggestions-subtitle">Here are a few things that might help right now</p>' +
            '    </div>' +
            '    <div class="suggestions-list" id="suggestions-list"></div>' +
            '    <div class="suggestions-footer">' +
            '      <button class="suggestions-primary" type="button">Sounds good</button>' +
            '      <button class="suggestions-secondary" type="button">Show me different suggestions</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        els.root = root;
        els.overlay = root.querySelector('#suggestions-overlay');
        els.modal = root.querySelector('.suggestions-modal');
        els.emoji = root.querySelector('.suggestions-emoji');
        els.title = root.querySelector('.suggestions-title');
        els.subtitle = root.querySelector('.suggestions-subtitle');
        els.list = root.querySelector('#suggestions-list');
        els.primary = root.querySelector('.suggestions-primary');
        els.reroll = root.querySelector('.suggestions-secondary');

        els.overlay.addEventListener('click', function (event) {
            if (event.target === els.overlay) {
                hide();
            }
        });

        els.primary.addEventListener('click', hide);
        els.reroll.addEventListener('click', function () {
            rerollSuggestions();
        });
    }

    function onKeydown(event) {
        if (event.key === 'Escape') {
            hide();
        }
    }

    function hexToRgb(hex) {
        var cleaned = hex.replace('#', '');
        if (cleaned.length === 3) {
            cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
        }
        var num = parseInt(cleaned, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    function setTheme(mood) {
        var color = MOOD_COLORS[mood] || '#E0DDD8';
        var rgb = hexToRgb(color);
        var border = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.3)';
        var tint = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.08)';
        var soft = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.16)';

        els.modal.style.setProperty('--mood-color', color);
        els.modal.style.setProperty('--mood-border', border);
        els.modal.style.setProperty('--mood-tint', tint);
        els.modal.style.setProperty('--mood-soft', soft);
    }

    function getSuggestionKey(suggestion) {
        return suggestion.category + '|' + suggestion.label + '|' + suggestion.action;
    }

    function shuffle(array) {
        var copy = array.slice();
        for (var i = copy.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = copy[i];
            copy[i] = copy[j];
            copy[j] = temp;
        }
        return copy;
    }

    function pickSuggestions(mood) {
        var list = SUGGESTIONS[mood] || [];
        if (!list.length) return [];

        var filtered = list.filter(function (item) {
            return state.lastKeys.indexOf(getSuggestionKey(item)) === -1;
        });

        var pool = filtered.length >= 3 ? filtered : list;
        var shuffled = shuffle(pool);
        var picked = shuffled.slice(0, Math.min(3, shuffled.length));
        state.lastKeys = picked.map(getSuggestionKey);
        return picked;
    }

    function renderCards(mood) {
        var picks = pickSuggestions(mood);
        els.list.innerHTML = '';

        picks.forEach(function (item, index) {
            var card = document.createElement('div');
            card.className = 'suggestion-card';
            card.style.animationDelay = (index * 0.08) + 's';
            card.innerHTML =
                '<div class="suggestion-icon">' + item.icon + '</div>' +
                '<div class="suggestion-text">' +
                '  <div class="suggestion-label">' + item.label + '</div>' +
                '  <div class="suggestion-action">' + item.action + '</div>' +
                '</div>';
            els.list.appendChild(card);
        });
    }

    function renderMood(mood) {
        var emoji = '';
        if (typeof window.getMood === 'function') {
            var match = window.getMood(mood.toLowerCase());
            emoji = match ? match.emoji : '';
        }

        els.emoji.textContent = emoji || '✨';
        els.title.textContent = TITLE_MAP[mood] || 'Take a moment';
        setTheme(mood);
        renderCards(mood);
    }

    function rerollSuggestions() {
        if (!state.activeMood) return;
        if (els.list.classList.contains('is-swapping')) return;

        els.list.classList.add('is-swapping');
        setTimeout(function () {
            renderCards(state.activeMood);
            els.list.classList.remove('is-swapping');
        }, 180);
    }

    function show(mood) {
        if (!mood || !SUGGESTIONS[mood]) return;
        buildModal();
        state.activeMood = mood;
        renderMood(mood);
        els.overlay.classList.add('active');
        document.addEventListener('keydown', onKeydown);
    }

    function hide() {
        if (!els.overlay) return;
        els.overlay.classList.remove('active');
        document.removeEventListener('keydown', onKeydown);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildModal);
    } else {
        buildModal();
    }

    window.suggestions = {
        show: show,
        hide: hide
    };
})();
