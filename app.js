let moodState = {
    selectedMood: null,
    selectedSubMood: null,
    selectedTags: [],
    journalText: '',
    entries: [],
    currentFilter: 'all',
    currentView: 'checkin',
    darkMode: false,
    moodSource: null,
    manuallySelected: false,
};

// ── LOAD FROM STORAGE ──
function loadEntries() {
    try {
        const stored = localStorage.getItem('moodlog_entries');
        if (stored) {
            moodState.entries = JSON.parse(stored);
        } else {
            moodState.entries = [...MOCK_ENTRIES];
            saveEntries();
        }
    } catch (e) {
        moodState.entries = [...MOCK_ENTRIES];
    }
}

function saveEntries() {
    localStorage.setItem('moodlog_entries', JSON.stringify(moodState.entries));
}

// ── DARK MODE ──
function loadDarkMode() {
    moodState.darkMode = localStorage.getItem('moodlog_dark') === 'true';
    applyDarkMode();
}
function applyDarkMode() {
    document.body.classList.toggle('dark', moodState.darkMode);
    document.getElementById('toggle-icon').textContent = moodState.darkMode ? '☀️' : '🌙';
    document.getElementById('toggle-label').textContent = moodState.darkMode ? 'Light mode' : 'Dark mode';
}

// ══════════════════════════════════════
// MOOD UTILS
// ══════════════════════════════════════

function getMood(key) { return MOODS.find(m => m.key === key); }
function getSubMood(primaryKey, subKey) {
    const list = SUB_MOODS[primaryKey] || [];
    return list.find(s => s.key === subKey);
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatFullDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function calcStreak() {
    if (!moodState.entries.length) return 0;
    const days = new Set(moodState.entries.map(e => new Date(e.date).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (days.has(d.toDateString())) {
            streak++;
        } else {
            if (i === 0) break; // no entry today, streak might still be alive from yesterday
            break;
        }
    }
    // Also check yesterday if no entry today
    if (streak === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        for (let i = 1; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (days.has(d.toDateString())) streak++;
            else break;
        }
    }
    return streak;
}

function calcAvgMood() {
    if (!moodState.entries.length) return null;
    const recent = moodState.entries.slice(-14);
    const avg = recent.reduce((s, e) => s + (MOOD_SCORE[e.mood] || 3), 0) / recent.length;
    if (avg >= 4.5) return 'Great';
    if (avg >= 3.5) return 'Good';
    if (avg >= 2.5) return 'Okay';
    if (avg >= 1.5) return 'Bad';
    return 'Awful';
}

const POSITIVE_TAGS = new Set([
    'calm', 'happy', 'grateful', 'excited', 'hopeful', 'proud', 'loved', 'inspired',
    'focused', 'content', 'playful', 'productive', 'confident', 'curious'
]);
const NEGATIVE_TAGS = new Set([
    'anxious', 'tired', 'frustrated', 'stressed', 'lonely', 'sad', 'angry',
    'overwhelmed', 'confused', 'numb'
]);

let savePulseTimer = null;

function setMoodWash(moodKey) {
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!moodKey) {
        main.style.removeProperty('--mood-wash');
        return;
    }
    const mood = getMood(moodKey);
    if (!mood) {
        main.style.removeProperty('--mood-wash');
        return;
    }
    main.style.setProperty('--mood-wash', `${mood.color}18`);
}

function updateSaveButton() {
    const btn = document.getElementById('save-btn');
    if (!btn) return;

    if (!moodState.selectedMood) {
        btn.textContent = 'Save entry';
        btn.classList.remove('has-mood', 'pulse', 'saving');
        btn.style.removeProperty('--save-color');
        if (savePulseTimer) {
            clearTimeout(savePulseTimer);
            savePulseTimer = null;
        }
        return;
    }

    const mood = getMood(moodState.selectedMood);
    const label = mood ? mood.label : moodState.selectedMood;
    btn.textContent = `Save - feeling ${label}`;
    btn.classList.add('has-mood');
    btn.style.setProperty('--save-color', mood ? mood.color : '');
    btn.classList.remove('pulse');

    if (savePulseTimer) {
        clearTimeout(savePulseTimer);
    }
    savePulseTimer = setTimeout(() => {
        if (moodState.selectedMood && !btn.classList.contains('saving')) {
            btn.classList.add('pulse');
        }
    }, 3000);
}

function renderGreeting() {
    const block = document.getElementById('greeting-block');
    if (!block) return;

    const hour = new Date().getHours();
    let pool = [];
    if (hour >= 5 && hour <= 11) {
        pool = [
            'Good morning. How are you carrying yourself today?',
            "Morning. What's the first feeling you notice right now?",
            'A new day. How does it feel so far?'
        ];
    } else if (hour >= 12 && hour <= 17) {
        pool = [
            "Hey. How's the day treating you?",
            'Halfway through. How are you holding up?',
            "Checking in. What's sitting with you right now?"
        ];
    } else if (hour >= 18 && hour <= 21) {
        pool = [
            'Evening. How did today feel?',
            "The day's winding down. How are you?",
            'How are you arriving at the end of today?'
        ];
    } else {
        pool = [
            'Still up. How are you feeling right now?',
            "Late night check-in. What's on your mind?",
            "It's late. How's your heart doing?"
        ];
    }

    const greeting = pool[Math.floor(Math.random() * pool.length)];
    let context = '';

    if (moodState.entries.length) {
        const last = moodState.entries[0];
        const lastMood = getMood(last.mood);
        if (lastMood) {
            const days = Math.floor((Date.now() - new Date(last.date)) / 86400000);
            const daysText = days === 0 ? 'today' : (days === 1 ? '1 day ago' : `${days} days ago`);
            if (lastMood.key === 'great' || lastMood.key === 'good') {
                context = `You were feeling ${lastMood.label} ${daysText}. Hoping today is just as good.`;
            } else if (lastMood.key === 'okay') {
                context = 'Last time you checked in, things felt pretty neutral.';
            } else {
                context = 'Last time was tough. Hope today feels a little lighter.';
            }
        }
    }

    block.innerHTML = `
<div class="greeting-title">${greeting}</div>
${context ? `<div class="greeting-context">${context}</div>` : ''}
`;

    block.classList.remove('greeting-animate');
    requestAnimationFrame(() => {
        block.classList.add('greeting-animate');
    });
}

// ══════════════════════════════════════
// RENDER HELPERS
// ══════════════════════════════════════

function moodCircleHTML(mood, size = 36) {
    return `<div class="entry-mood-circle" style="background:${mood.color}20;width:${size}px;height:${size}px;">${mood.emoji}</div>`;
}

// ══════════════════════════════════════
// RENDER: SIDEBAR STREAK
// ══════════════════════════════════════
function renderStreak() {
    const s = calcStreak();
    document.getElementById('streak-text').textContent = `${s} day streak`;
}

// ══════════════════════════════════════
// RENDER: CHECK-IN
// ══════════════════════════════════════
function renderMoodRow() {
    const row = document.getElementById('mood-row');
    row.innerHTML = '';
    MOODS.forEach(mood => {
        const btn = document.createElement('button');
        btn.className = 'mood-btn' + (moodState.selectedMood === mood.key ? ' selected' : '');
        btn.setAttribute('aria-label', mood.label);
        btn.setAttribute('aria-pressed', moodState.selectedMood === mood.key ? 'true' : 'false');
        btn.style.setProperty('--ring-color', mood.ring);
        btn.innerHTML = `
<div class="mood-circle" style="background:${mood.color}30;">
${mood.emoji}
</div>
<span class="mood-label">${mood.label}</span>
`;
        btn.addEventListener('click', () => selectMood(mood.key, 'manual'));
        row.appendChild(btn);
    });
}

function renderSubMoodRow() {
    const block = document.getElementById('sub-mood-block');
    const row = document.getElementById('sub-mood-row');
    if (!block || !row) return;

    row.innerHTML = '';
    const primary = moodState.selectedMood;
    const options = primary ? (SUB_MOODS[primary] || []) : [];

    if (!options.length) {
        block.style.display = 'none';
        return;
    }

    block.style.display = 'block';
    options.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = 'sub-mood-btn' + (moodState.selectedSubMood === sub.key ? ' selected' : '');
        btn.setAttribute('aria-label', sub.label);
        btn.setAttribute('aria-pressed', moodState.selectedSubMood === sub.key ? 'true' : 'false');
        btn.style.setProperty('--ring-color', sub.color);
        btn.innerHTML = `
<div class="sub-mood-circle" style="background:${sub.color}30;">
${sub.emoji}
</div>
<span class="sub-mood-label">${sub.label}</span>
`;
        btn.addEventListener('click', () => selectSubMood(sub.key));
        row.appendChild(btn);
    });

    row.classList.remove('animate-in');
    requestAnimationFrame(() => {
        row.classList.add('animate-in');
    });
}

function selectSubMood(key) {
    moodState.selectedSubMood = key;
    renderSubMoodRow();
}

function selectMood(key, source) {
    moodState.selectedSubMood = null;
    moodState.selectedMood = key;
    moodState.moodSource = source || 'manual';
    if (source === 'manual') {
        moodState.manuallySelected = true;
        document.dispatchEvent(new CustomEvent('sliders:manual'));
    }
    setMoodWash(key);
    renderMoodRow();
    renderSubMoodRow();
    updateSaveButton();
}

// EMOTION_HOOK: call setDetectedEmotion(label) to override mood
function setDetectedEmotion(label) {
    if (!label) return;

    const normalized = label.toLowerCase();
    const byLabel = MOODS.find(m => m.label.toLowerCase() === normalized);
    const byKey = MOODS.find(m => m.key === normalized);
    if (byLabel) {
        selectMood(byLabel.key, 'detected');
        return;
    }
    if (byKey) {
        selectMood(byKey.key, 'detected');
        return;
    }

    const moodMap = { happy: 'great', sad: 'bad', angry: 'awful', surprised: 'good', neutral: 'okay', fearful: 'bad', disgusted: 'awful' };
    const mapped = moodMap[normalized];
    if (mapped) selectMood(mapped, 'detected');
}

function renderTagsGrid() {
    const grid = document.getElementById('tags-grid');
    grid.innerHTML = '';
    EMOTION_TAGS.forEach(tag => {
        const lower = tag.toLowerCase();
        const btn = document.createElement('button');
        btn.className = 'tag-pill' + (moodState.selectedTags.includes(tag) ? ' selected' : '');
        btn.textContent = tag;
        btn.setAttribute('aria-pressed', moodState.selectedTags.includes(tag) ? 'true' : 'false');
        if (POSITIVE_TAGS.has(lower)) {
            btn.dataset.valence = 'positive';
        } else if (NEGATIVE_TAGS.has(lower)) {
            btn.dataset.valence = 'negative';
        }
        btn.addEventListener('click', () => toggleTag(tag));
        grid.appendChild(btn);
    });
}

function toggleTag(tag) {
    if (moodState.selectedTags.includes(tag)) {
        moodState.selectedTags = moodState.selectedTags.filter(t => t !== tag);
    } else {
        moodState.selectedTags.push(tag);
    }
    renderTagsGrid();
}

function renderWeekStrip() {
    const strip = document.getElementById('week-strip');
    strip.innerHTML = '';
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toDateString();
        const label = i === 0 ? 'Today' : days[d.getDay()];
        // Find entry for this day (latest)
        const entry = moodState.entries
            .filter(e => new Date(e.date).toDateString() === ds)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        const mood = entry ? getMood(entry.mood) : null;
        const isToday = i === 0;

        const div = document.createElement('div');
        div.className = 'week-day' + (entry ? ' has-entry' : '') + (isToday ? ' today' : '');
        div.setAttribute('role', 'listitem');
        div.style.setProperty('--i', (6 - i).toString());
        div.innerHTML = `
<span class="wd-label">${label}</span>
    <span class="wd-underline" style="${mood ? `background:${mood.color};` : ''}"></span>
<div class="wd-dot" style="${mood ? `background:${mood.color}40;` : ''}" title="${mood ? mood.label : 'No entry'}">
${mood ? mood.emoji : ''}
</div>
`;
        strip.appendChild(div);
    }
}

function setupCheckin() {
    renderMoodRow();
    renderSubMoodRow();
    renderTagsGrid();
    renderWeekStrip();
    renderGreeting();
    updateSaveButton();
    document.body.classList.add('checkin-view');

    const textarea = document.getElementById('journal-input');
    const counter = document.getElementById('char-counter');
    textarea.value = moodState.journalText || '';
    counter.textContent = `${textarea.value.length} / 280`;

    textarea.addEventListener('input', () => {
        moodState.journalText = textarea.value;
        counter.textContent = `${textarea.value.length} / 280`;
        if (textarea.value.length >= 260) counter.style.color = '#E88C8C';
        else counter.style.color = '';
    });

    if (window.guidedSliders && window.guidedSliders.init) {
        window.guidedSliders.init();
    }

    document.getElementById('save-btn').addEventListener('click', saveEntry);
}

function saveEntry() {
    if (!moodState.selectedMood) {
        showToast('Please select a mood first 😊');
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.classList.add('saving');
        saveBtn.textContent = '✓';
    }

    const mood = getMood(moodState.selectedMood);
    const subMood = moodState.selectedSubMood
        ? getSubMood(moodState.selectedMood, moodState.selectedSubMood)
        : null;
    const entry = {
        id: 'entry_' + Date.now(),
        date: new Date().toISOString(),
        mood: moodState.selectedMood,
        moodLabel: mood ? mood.label : moodState.selectedMood,
        subMood: moodState.selectedSubMood || null,
        subMoodLabel: subMood ? subMood.label : null,
        tags: [...moodState.selectedTags],
        note: moodState.journalText || '',
        source: moodState.moodSource || 'manual',
    };

    moodState.entries.unshift(entry);
    saveEntries();

    // Reset
    moodState.selectedMood = null;
    moodState.moodSource = null;
    moodState.manuallySelected = false;
    moodState.selectedSubMood = null;
    moodState.selectedTags = [];
    moodState.journalText = '';
    setMoodWash(null);
    document.getElementById('journal-input').value = '';
    document.getElementById('char-counter').textContent = '0 / 280';
    const subRow = document.getElementById('sub-mood-row');
    if (subRow) subRow.innerHTML = '';
    const subBlock = document.getElementById('sub-mood-block');
    if (subBlock) subBlock.style.display = 'none';

    renderMoodRow();
    renderSubMoodRow();
    renderTagsGrid();
    renderWeekStrip();
    renderStreak();

    showToast('Entry saved ✓');
    window.suggestions.show(entry.moodLabel);
    document.dispatchEvent(new CustomEvent('sliders:reset'));
    switchView('journal');

    if (saveBtn) {
        setTimeout(() => {
            saveBtn.classList.remove('saving');
            updateSaveButton();
        }, 600);
    }
}

// ══════════════════════════════════════
// RENDER: JOURNAL
// ══════════════════════════════════════

function renderJournal() {
    renderFilterBar();
    renderEntryCards();
}

function renderFilterBar() {
    const bar = document.getElementById('filter-bar');
    bar.innerHTML = '';
    const filters = ['all', ...MOOD_KEYS];
    filters.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'filter-pill' + (moodState.currentFilter === f ? ' active' : '');
        btn.textContent = f === 'all' ? 'All' : (getMood(f)?.emoji + ' ' + getMood(f)?.label);
        btn.setAttribute('aria-pressed', moodState.currentFilter === f ? 'true' : 'false');
        btn.addEventListener('click', () => {
            moodState.currentFilter = f;
            renderFilterBar();
            renderEntryCards();
        });
        bar.appendChild(btn);
    });
}

function renderEntryCards() {
    const grid = document.getElementById('entries-grid');
    grid.innerHTML = '';

    let filtered = moodState.entries;
    if (moodState.currentFilter !== 'all') {
        filtered = filtered.filter(e => e.mood === moodState.currentFilter);
    }

    document.getElementById('page-title').textContent = `My Journal (${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'})`;

    if (!filtered.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
<div class="empty-icon">📔</div>
<p>No entries yet for this filter.<br>Start logging your mood in Check-in!</p>
</div>`;
        return;
    }

    filtered.forEach((entry, idx) => {
        const mood = getMood(entry.mood);
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.style.animationDelay = `${idx * 0.06}s`;

        const visibleTags = entry.tags.slice(0, 3);
        const extraTags = entry.tags.length - 3;
        const tagsHTML = visibleTags.map(t => `<span class="entry-tag">${t}</span>`).join('') +
            (extraTags > 0 ? `<span class="entry-tag more">+${extraTags}</span>` : '');

        const preview = entry.note || '<em style="color:var(--text-2);">No note added.</em>';

        const subMoodHTML = entry.subMoodLabel
            ? `<span class="entry-submood-pill">${entry.subMoodLabel}</span>`
            : '';

        card.innerHTML = `
<div class="entry-card-top">
<div style="display:flex;align-items:center;gap:10px;">
  ${moodCircleHTML(mood, 36)}
  <div>
        <div class="entry-mood-meta">
            <span class="entry-mood-label">${mood.label}</span>
            ${subMoodHTML}
        </div>
    <div class="entry-date">${formatDate(entry.date)}</div>
  </div>
</div>
</div>
<div class="entry-tags">${tagsHTML}</div>
<div class="entry-preview" id="preview-${entry.id}">${preview}</div>
<div class="entry-actions">
<button class="read-more-btn" data-id="${entry.id}" aria-expanded="false">Read more</button>
<button class="delete-btn" data-id="${entry.id}" aria-label="Delete entry" title="Delete entry">🗑</button>
</div>
`;

        card.querySelector('.read-more-btn').addEventListener('click', function () {
            const preview = document.getElementById(`preview-${entry.id}`);
            const expanded = preview.classList.toggle('expanded');
            this.textContent = expanded ? 'Show less' : 'Read more';
            this.setAttribute('aria-expanded', expanded);
        });

        card.querySelector('.delete-btn').addEventListener('click', () => deleteEntry(entry.id));

        grid.appendChild(card);
    });
}

function deleteEntry(id) {
    const entry = moodState.entries.find(e => e.id === id);
    if (!entry) return;

    moodState.entries = moodState.entries.filter(e => e.id !== id);
    saveEntries();
    renderEntryCards();
    renderStreak();

    let undone = false;
    const undoFn = () => {
        if (!undone) {
            undone = true;
            moodState.entries.unshift(entry);
            moodState.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
            saveEntries();
            renderEntryCards();
            renderStreak();
            showToast('Entry restored ↩️');
        }
    };

    showToast('Entry deleted', 5000, 'Undo', undoFn);
}

// ══════════════════════════════════════
// RENDER: INSIGHTS
// ══════════════════════════════════════

function renderInsights() {
    renderStatCards();
    renderMoodCalendar();
    renderBarChart();
    renderInsightText();
}

function renderStatCards() {
    const el = document.getElementById('stat-cards');
    const streak = calcStreak();
    const avg = calcAvgMood() || 'N/A';
    const total = moodState.entries.length;
    el.innerHTML = `
<div class="stat-card">
<div class="stat-label">Current streak</div>
<div class="stat-value">${streak}</div>
<div class="stat-sub">${streak === 1 ? 'day' : 'days'} in a row 🔥</div>
</div>
<div class="stat-card">
<div class="stat-label">Avg mood (14d)</div>
<div class="stat-value" style="font-size:28px;">${avg === 'N/A' ? '—' : (getMood(avg.toLowerCase())?.emoji || avg)}</div>
<div class="stat-sub">${avg}</div>
</div>
<div class="stat-card">
<div class="stat-label">Total entries</div>
<div class="stat-value">${total}</div>
<div class="stat-sub">${total === 1 ? 'log entry' : 'log entries'}</div>
</div>
`;
}

function renderMoodCalendar() {
    const el = document.getElementById('mood-calendar');
    const today = new Date();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = '<h2>This Week</h2><div style="display:flex;gap:8px;">';

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toDateString();
        const label = i === 0 ? 'Today' : dayLabels[d.getDay()].slice(0, 1);

        const entry = moodState.entries
            .filter(e => new Date(e.date).toDateString() === ds)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const mood = entry ? getMood(entry.mood) : null;

        html += `<div class="cal-day-col">
<span class="cal-day-label">${label}</span>
<div class="cal-dot ${mood ? 'filled' : ''}" style="${mood ? `background:${mood.color}35;` : ''}" title="${mood ? mood.label : 'No entry'}">
${mood ? mood.emoji : ''}
</div>
</div>`;
    }
    html += '</div>';
    el.innerHTML = html;
}

function renderBarChart() {
    const inner = document.getElementById('bar-chart-inner');
    inner.innerHTML = '';

    // Count by mood
    const counts = {};
    MOOD_KEYS.forEach(k => counts[k] = 0);
    moodState.entries.forEach(e => { if (counts[e.mood] !== undefined) counts[e.mood]++; });
    const total = moodState.entries.length || 1;

    MOOD_KEYS.forEach(key => {
        const mood = getMood(key);
        const pct = Math.round((counts[key] / total) * 100);
        const col = document.createElement('div');
        col.className = 'bar-col';
        col.innerHTML = `
<div class="bar-wrap">
<div class="bar-fill" style="height:0;background:${mood.color}80;border-radius:8px 8px 4px 4px;" data-pct="${pct}">
  <span class="bar-pct" style="color:${mood.color};">${pct > 5 ? pct + '%' : ''}</span>
</div>
</div>
<div class="bar-mood-label">${mood.emoji}</div>
`;
        inner.appendChild(col);
    });

    // Animate bars after a tick
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            inner.querySelectorAll('.bar-fill').forEach(bar => {
                const pct = parseInt(bar.dataset.pct);
                bar.style.height = `${pct}%`;
            });
        });
    });
}

function renderInsightText() {
    const el = document.getElementById('insight-text');
    if (!moodState.entries.length) {
        el.textContent = 'Start logging your mood to see personalized insights here.';
        return;
    }

    const streak = calcStreak();
    const recent = moodState.entries.slice(0, 7);
    const greatCount = recent.filter(e => e.mood === 'great').length;
    const goodCount = recent.filter(e => e.mood === 'good').length;
    const posCount = greatCount + goodCount;
    const posPct = Math.round((posCount / recent.length) * 100);

    let insight = '';
    if (streak >= 5) {
        insight = `You've logged ${streak} days in a row — that kind of consistency is rare and powerful. `;
    } else if (streak >= 2) {
        insight = `${streak} days in a row — you're building a great habit. `;
    } else {
        insight = `You have ${moodState.entries.length} total entries — every log tells a story. `;
    }

    if (posCount > 0 && recent.length > 0) {
        insight += `Positive days (Good + Great) made up ${posPct}% of your recent week.`;
    }

    const mostCommonMood = MOOD_KEYS.reduce((best, k) => {
        const cnt = recent.filter(e => e.mood === k).length;
        return cnt > (best.cnt || 0) ? { key: k, cnt } : best;
    }, {});

    if (mostCommonMood.key && mostCommonMood.cnt > 1) {
        const mood = getMood(mostCommonMood.key);
        insight += ` Your most frequent mood has been ${mood.emoji} ${mood.label}.`;
    }

    el.textContent = insight;
}

// ══════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════

const VIEW_TITLES = {
    checkin: 'How are you feeling?',
    journal: 'My Journal',
    insights: 'Insights',
};

function switchView(view) {
    if (moodState.currentView === 'checkin' && view !== 'checkin') {
        if (moodState.selectedMood || moodState.journalText.trim() || moodState.selectedTags.length) {
            if (!confirm('You have unsaved changes. Leave without saving?')) return;
        }
    }

    moodState.currentView = view;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(a => {
        a.classList.toggle('active', a.dataset.view === view);
    });

    document.getElementById('page-title').textContent = view === 'checkin' ? '' : (VIEW_TITLES[view] || '');
    document.body.classList.toggle('checkin-view', view === 'checkin');

    if (view === 'journal') renderJournal();
    if (view === 'insights') renderInsights();
    if (view === 'checkin') {
        renderWeekStrip();
        renderMoodRow();
        renderSubMoodRow();
        renderTagsGrid();
        renderGreeting();
        updateSaveButton();
        if (window.guidedSliders && window.guidedSliders.init) {
            window.guidedSliders.init();
        }
    } else if (window.guidedSliders && window.guidedSliders.destroy) {
        window.guidedSliders.destroy();
    }
}

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════

function showToast(msg, duration = 3000, undoLabel = null, undoFn = null) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${msg}</span>`;
    if (undoLabel && undoFn) {
        const btn = document.createElement('button');
        btn.className = 'toast-undo';
        btn.textContent = undoLabel;
        btn.addEventListener('click', () => {
            undoFn();
            dismissToast(toast);
        });
        toast.appendChild(btn);
    }
    container.appendChild(toast);

    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;
}

function dismissToast(toast) {
    clearTimeout(toast._timer);
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 220);
}

// ══════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════

function initOnboarding() {
    if (localStorage.getItem('moodlog_onboarded')) return;
    localStorage.setItem('moodlog_onboarded', 'true');

    const overlay = document.getElementById('onb-overlay');
    const onb = document.getElementById('onboarding');
    overlay.style.display = 'block';
    onb.style.display = 'block';

    const steps = [
        {
            html: `<div class="onb-title">👋 Welcome to moodlog</div>
     <p>Track your daily mood and build emotional awareness. Let's take a quick tour.</p>`,
            pos: { top: '40%', left: '260px' },
            arrowClass: 'arrow-left',
        },
        {
            html: `<div class="onb-title">✦ Log your mood</div>
     <p>Pick an emoji that matches how you feel, add emotion tags, and write a note.</p>`,
            pos: { top: '180px', left: '300px' },
            arrowClass: 'arrow-left',
        },
        {
            html: `<div class="onb-title">📊 Track your patterns</div>
     <p>Head to <strong>Insights</strong> to see your mood trends and streaks over time.</p>`,
            pos: { top: '50%', left: '260px' },
            arrowClass: 'arrow-left',
        },
    ];

    let currentStep = 0;

    function showStep(i) {
        onb.innerHTML = '';
        if (i >= steps.length) {
            overlay.style.display = 'none';
            onb.style.display = 'none';
            return;
        }
        const s = steps[i];
        const div = document.createElement('div');
        div.className = `onb-step ${s.arrowClass}`;
        Object.assign(div.style, s.pos);
        div.innerHTML = s.html + `
<div style="margin-top:12px;display:flex;align-items:center;">
<button class="onb-next">${i < steps.length - 1 ? 'Next →' : 'Get started'}</button>
<button class="onb-skip">Skip</button>
</div>
`;
        div.querySelector('.onb-next').addEventListener('click', () => showStep(i + 1));
        div.querySelector('.onb-skip').addEventListener('click', () => {
            overlay.style.display = 'none';
            onb.style.display = 'none';
        });
        onb.appendChild(div);
    }

    showStep(0);
}

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════

function init() {
    loadEntries();
    loadDarkMode();

    // Topbar date
    document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    setupCheckin();
    renderStreak();

    // Nav click events
    document.querySelectorAll('.nav-item').forEach(a => {
        a.addEventListener('click', () => switchView(a.dataset.view));
        a.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchView(a.dataset.view); } });
    });

    // Dark mode toggle
    const darkToggle = document.getElementById('dark-toggle');
    darkToggle.addEventListener('click', () => {
        moodState.darkMode = !moodState.darkMode;
        localStorage.setItem('moodlog_dark', moodState.darkMode);
        applyDarkMode();
    });
    darkToggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); darkToggle.click(); } });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        if (e.key === 'c' || e.key === 'C') switchView('checkin');
        if (e.key === 'j' || e.key === 'J') switchView('journal');
        if (e.key === 'i' || e.key === 'I') switchView('insights');
    });

    // Beforeunload guard
    window.addEventListener('beforeunload', e => {
        if (moodState.currentView === 'checkin' &&
            (moodState.selectedMood || moodState.journalText.trim() || moodState.selectedTags.length)) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Onboarding
    setTimeout(initOnboarding, 400);
}

document.addEventListener('DOMContentLoaded', init);