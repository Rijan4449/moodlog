// ══════════════════════════════════════
// DATA & STATE
// ══════════════════════════════════════

const MOODS = [
    { key: 'awful', label: 'Awful', emoji: '😢', color: '#B8A9D4', ring: '#B8A9D4' },
    { key: 'bad', label: 'Bad', emoji: '😕', color: '#A8C5A0', ring: '#A8C5A0' },
    { key: 'okay', label: 'Okay', emoji: '😐', color: '#F5D08A', ring: '#F5D08A' },
    { key: 'good', label: 'Good', emoji: '🙂', color: '#E8A87C', ring: '#E8A87C' },
    { key: 'great', label: 'Great', emoji: '😄', color: '#E88C8C', ring: '#E88C8C' },
];
const SUB_MOODS = {
    awful: [
        { key: 'devastated', label: 'Devastated', emoji: '😭', color: '#9B8EC4' },
        { key: 'hopeless', label: 'Hopeless', emoji: '😞', color: '#A090C8' },
        { key: 'disgusted', label: 'Disgusted', emoji: '🤢', color: '#8E7FBE' },
        { key: 'terrified', label: 'Terrified', emoji: '😱', color: '#B5A6D6' },
        { key: 'ashamed', label: 'Ashamed', emoji: '😔', color: '#A89CCC' },
    ],
    bad: [
        { key: 'sad', label: 'Sad', emoji: '😢', color: '#8AB89A' },
        { key: 'anxious', label: 'Anxious', emoji: '😰', color: '#92BEA2' },
        { key: 'angry', label: 'Angry', emoji: '😠', color: '#9EC4AA' },
        { key: 'lonely', label: 'Lonely', emoji: '🫂', color: '#86B496' },
        { key: 'exhausted', label: 'Exhausted', emoji: '😩', color: '#94BAA4' },
    ],
    okay: [
        { key: 'neutral', label: 'Neutral', emoji: '😐', color: '#E8C87A' },
        { key: 'confused', label: 'Confused', emoji: '😕', color: '#EDD080' },
        { key: 'bored', label: 'Bored', emoji: '😑', color: '#E4C474' },
        { key: 'pensive', label: 'Pensive', emoji: '🤔', color: '#EAC97E' },
        { key: 'nostalgic', label: 'Nostalgic', emoji: '🌅', color: '#E6C676' },
    ],
    good: [
        { key: 'happy', label: 'Happy', emoji: '😊', color: '#E09A6C' },
        { key: 'relieved', label: 'Relieved', emoji: '😮‍💨', color: '#E4A272' },
        { key: 'grateful', label: 'Grateful', emoji: '🙏', color: '#D89468' },
        { key: 'motivated', label: 'Motivated', emoji: '💪', color: '#E6A070' },
        { key: 'peaceful', label: 'Peaceful', emoji: '😌', color: '#DCA074' },
    ],
    great: [
        { key: 'ecstatic', label: 'Ecstatic', emoji: '🤩', color: '#E07878' },
        { key: 'proud', label: 'Proud', emoji: '😤', color: '#E48080' },
        { key: 'excited', label: 'Excited', emoji: '🥳', color: '#E27C7C' },
        { key: 'inspired', label: 'Inspired', emoji: '✨', color: '#E68484' },
        { key: 'loved', label: 'Loved', emoji: '🥰', color: '#E07676' },
    ],
};
const MOOD_SCORE = { awful: 1, bad: 2, okay: 3, good: 4, great: 5 };
const MOOD_KEYS = ['awful', 'bad', 'okay', 'good', 'great'];

const EMOTION_TAGS = [
    'Calm', 'Happy', 'Grateful', 'Excited', 'Hopeful', 'Proud', 'Loved', 'Inspired',
    'Focused', 'Content', 'Curious', 'Playful',
    'Anxious', 'Tired', 'Frustrated', 'Stressed', 'Lonely', 'Sad',
    'Angry', 'Overwhelmed', 'Confused', 'Numb'
];

// ── MOCK ENTRIES ──
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

const MOCK_ENTRIES = [
    { id: 'mock1', date: daysAgo(6), mood: 'great', tags: ['Happy', 'Grateful', 'Excited'], note: "Had an amazing meeting today — everything clicked. Felt like I was finally in the zone and the team loved the new direction. Couldn't stop smiling on my walk home." },
    { id: 'mock2', date: daysAgo(5), mood: 'good', tags: ['Calm', 'Focused', 'Content'], note: "Quiet productive morning. Made progress on the project, had a long lunch outside. The weather was perfect and I felt genuinely at peace." },
    { id: 'mock3', date: daysAgo(5), mood: 'okay', tags: ['Tired', 'Curious'], note: "A bit drained by 3pm but pushed through. Interesting article about habit formation kept me engaged in the evening." },
    { id: 'mock4', date: daysAgo(4), mood: 'bad', tags: ['Stressed', 'Anxious', 'Overwhelmed'], note: "Too many deadlines converging. Felt like I was spinning plates all day. Managed to take a short walk which helped a little." },
    { id: 'mock5', date: daysAgo(3), mood: 'okay', tags: ['Calm', 'Tired'], note: "Recovery day. Slept in, hydrated, light work. Nothing too exciting but I needed the rest." },
    { id: 'mock6', date: daysAgo(2), mood: 'good', tags: ['Grateful', 'Loved', 'Content'], note: "Dinner with old friends. Laughed until my sides hurt. These moments remind me what actually matters." },
    { id: 'mock7', date: daysAgo(1), mood: 'great', tags: ['Inspired', 'Excited', 'Happy'], note: "Started a new creative side project. Spent hours in flow state. Went to bed with that rare feeling that tomorrow will be even better." },
];