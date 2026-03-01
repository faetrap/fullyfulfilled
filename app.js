// ===== DREAD — Fear RPG Habit Tracker =====

const RANKS = [
  { name: 'Fearless Hero',        maxFear: 15,  art: '🛡️', flavor: 'The darkness cannot touch you... yet.' },
  { name: 'Brave Warrior',        maxFear: 30,  art: '⚔️', flavor: 'You stand firm, but shadows gather at the edges.' },
  { name: 'Nervous Adventurer',   maxFear: 45,  art: '🕯️', flavor: 'Your candle flickers. Something watches from the dark.' },
  { name: 'Frightened Wanderer',  maxFear: 60,  art: '👁️', flavor: 'You hear whispers. The walls are closing in.' },
  { name: 'Trembling Wreck',      maxFear: 80,  art: '💀', flavor: 'Your hands shake. The darkness knows your name.' },
  { name: 'Consumed by Fear',     maxFear: 100, art: '🕳️', flavor: 'You are lost. Only your rituals can save you now.' },
];

const XP_VALUES = { easy: 5, medium: 10, hard: 20 };
const FEAR_REDUCTION = { easy: 3, medium: 6, hard: 10 };
const FEAR_PER_HOUR = 0.5; // fear gained per hour of inactivity
const FEAR_MISS_PENALTY = 8; // extra fear per incomplete task at end of day

// ===== State =====

let state = loadState();

function defaultState() {
  return {
    habits: [],
    fear: 0,
    xp: 0,
    streak: 0,
    lastVisit: Date.now(),
    lastDayReset: todayKey(),
    log: [],
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  try {
    const saved = localStorage.getItem('dread-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState(), ...parsed };
    }
  } catch (e) { /* ignore */ }
  return defaultState();
}

function saveState() {
  localStorage.setItem('dread-state', JSON.stringify(state));
}

// ===== Time-Based Fear Decay =====

function applyTimeFear() {
  const now = Date.now();
  const hoursPassed = (now - state.lastVisit) / (1000 * 60 * 60);

  if (hoursPassed >= 1) {
    const fearGain = Math.floor(hoursPassed * FEAR_PER_HOUR);
    if (fearGain > 0) {
      const oldFear = state.fear;
      state.fear = Math.min(100, state.fear + fearGain);
      if (state.fear > oldFear) {
        addLog(`The darkness crept in while you were away... (+${state.fear - oldFear} fear)`, 'fear-rise');
      }
    }
  }

  state.lastVisit = now;
}

// ===== Daily Reset =====

function checkDailyReset() {
  const today = todayKey();
  if (state.lastDayReset !== today) {
    // Check yesterday's completion
    const totalHabits = state.habits.length;
    const completedYesterday = state.habits.filter(h => h.completedDate === state.lastDayReset).length;

    if (totalHabits > 0) {
      const incompleteCount = totalHabits - completedYesterday;

      if (incompleteCount > 0) {
        const penalty = incompleteCount * FEAR_MISS_PENALTY;
        state.fear = Math.min(100, state.fear + penalty);
        addLog(`${incompleteCount} ritual(s) left undone. The fear surges. (+${penalty} fear)`, 'fear-rise');
        state.streak = 0;
      } else {
        state.streak++;
        const streakBonus = Math.min(state.streak * 2, 10);
        state.fear = Math.max(0, state.fear - streakBonus);
        addLog(`All rituals completed! Streak: ${state.streak} day(s). (-${streakBonus} fear)`, 'xp-gain');
      }
    }

    // Reset completion status for new day
    state.habits.forEach(h => {
      if (h.completedDate !== today) {
        h.completedDate = null;
      }
    });

    state.lastDayReset = today;
  }
}

// ===== Rank Calculation =====

function getRank(fear) {
  for (const rank of RANKS) {
    if (fear <= rank.maxFear) return rank;
  }
  return RANKS[RANKS.length - 1];
}

// ===== Logging =====

function addLog(message, type = '') {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.log.unshift({ message, type, time });
  if (state.log.length > 50) state.log.pop();
}

// ===== Habit Actions =====

function addHabit(name, difficulty) {
  const habit = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    difficulty,
    completedDate: null,
    createdAt: Date.now(),
  };
  state.habits.push(habit);
  addLog(`New ritual added: "${name}"`, '');
  saveState();
  render();
}

function toggleHabit(id) {
  const habit = state.habits.find(h => h.id === id);
  if (!habit) return;

  const today = todayKey();
  if (habit.completedDate === today) {
    // Undo completion
    habit.completedDate = null;
    const xpLoss = XP_VALUES[habit.difficulty];
    const fearReturn = FEAR_REDUCTION[habit.difficulty];
    state.xp = Math.max(0, state.xp - xpLoss);
    state.fear = Math.min(100, state.fear + fearReturn);
    addLog(`Ritual undone: "${habit.name}" (-${xpLoss} XP, +${fearReturn} fear)`, 'fear-rise');
  } else {
    // Complete
    habit.completedDate = today;
    const xpGain = XP_VALUES[habit.difficulty];
    const fearReduce = FEAR_REDUCTION[habit.difficulty];
    state.xp += xpGain;
    state.fear = Math.max(0, state.fear - fearReduce);
    addLog(`Ritual completed: "${habit.name}" (+${xpGain} XP, -${fearReduce} fear)`, 'xp-gain');
  }

  saveState();
  render();
}

function deleteHabit(id) {
  const habit = state.habits.find(h => h.id === id);
  if (!habit) return;

  state.habits = state.habits.filter(h => h.id !== id);
  addLog(`Ritual abandoned: "${habit.name}"`, '');
  saveState();
  render();
}

function resetGame() {
  if (!confirm('Are you sure you want to abandon your quest? All progress will be lost.')) return;
  localStorage.removeItem('dread-state');
  state = defaultState();
  addLog('A new journey begins...', 'rank-change');
  saveState();
  render();
}

// ===== Rendering =====

function render() {
  const today = todayKey();
  const rank = getRank(state.fear);
  const prevRankEl = document.getElementById('character-rank');
  const prevRank = prevRankEl ? prevRankEl.textContent : '';

  // Character display
  document.getElementById('character-art').textContent = rank.art;
  document.getElementById('character-rank').textContent = rank.name;
  document.getElementById('character-flavor').textContent = rank.flavor;

  // Rank change effect
  if (prevRank && prevRank !== rank.name) {
    const panel = document.getElementById('character-panel');
    panel.classList.add('shake');
    setTimeout(() => panel.classList.remove('shake'), 300);

    if (RANKS.indexOf(rank) > RANKS.findIndex(r => r.name === prevRank)) {
      addLog(`You have fallen to: ${rank.name}`, 'fear-rise');
    } else {
      addLog(`You have risen to: ${rank.name}`, 'rank-change');
    }
  }

  // Fear meter
  const fearFill = document.getElementById('fear-fill');
  fearFill.style.width = `${state.fear}%`;
  document.getElementById('fear-value').textContent = Math.round(state.fear);

  // Fear color
  if (state.fear <= 25) {
    fearFill.style.background = 'var(--fear-low)';
  } else if (state.fear <= 50) {
    fearFill.style.background = 'var(--fear-mid)';
  } else if (state.fear <= 75) {
    fearFill.style.background = 'var(--fear-high)';
  } else {
    fearFill.style.background = 'var(--fear-max)';
  }

  // Fear glow on panel
  const charPanel = document.getElementById('character-panel');
  if (state.fear >= 60) {
    charPanel.classList.add('fear-glow');
    if (state.fear >= 80) charPanel.classList.add('pulse');
    else charPanel.classList.remove('pulse');
  } else {
    charPanel.classList.remove('fear-glow', 'pulse');
  }

  // Stats
  const completedToday = state.habits.filter(h => h.completedDate === today).length;
  document.getElementById('tasks-done-today').textContent = `${completedToday}/${state.habits.length}`;
  document.getElementById('streak-count').textContent = state.streak;
  document.getElementById('total-xp').textContent = state.xp;

  // Habit list
  const habitList = document.getElementById('habit-list');
  const emptyState = document.getElementById('empty-state');

  if (state.habits.length === 0) {
    habitList.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    habitList.innerHTML = state.habits.map(habit => {
      const done = habit.completedDate === today;
      const xp = XP_VALUES[habit.difficulty];
      const diffLabel = habit.difficulty.charAt(0).toUpperCase() + habit.difficulty.slice(1);

      return `
        <li class="habit-item ${done ? 'completed' : ''}" data-id="${habit.id}">
          <button class="habit-check" onclick="toggleHabit('${habit.id}')">${done ? '✓' : ''}</button>
          <div class="habit-info">
            <div class="habit-name">${escapeHtml(habit.name)}</div>
            <div class="habit-meta">${diffLabel} · <span class="habit-xp">${xp} XP</span></div>
          </div>
          <button class="habit-delete" onclick="deleteHabit('${habit.id}')" title="Remove ritual">✕</button>
        </li>
      `;
    }).join('');
  }

  // Event log
  const logList = document.getElementById('event-log');
  logList.innerHTML = state.log.map(entry => `
    <li class="log-entry ${entry.type}">
      <span class="log-time">${entry.time}</span>${escapeHtml(entry.message)}
    </li>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Event Listeners =====

document.getElementById('add-habit-btn').addEventListener('click', () => {
  const form = document.getElementById('add-habit-form');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) {
    document.getElementById('habit-input').focus();
  }
});

document.getElementById('cancel-habit-btn').addEventListener('click', () => {
  document.getElementById('add-habit-form').classList.add('hidden');
  document.getElementById('habit-input').value = '';
});

document.getElementById('save-habit-btn').addEventListener('click', () => {
  const input = document.getElementById('habit-input');
  const difficulty = document.getElementById('habit-difficulty').value;
  const name = input.value.trim();

  if (!name) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 300);
    return;
  }

  addHabit(name, difficulty);
  input.value = '';
  document.getElementById('add-habit-form').classList.add('hidden');
});

document.getElementById('habit-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('save-habit-btn').click();
  }
});

document.getElementById('reset-btn').addEventListener('click', resetGame);

// ===== Periodic Fear Tick =====
// Every 5 minutes, fear creeps up slightly while the page is open
setInterval(() => {
  if (state.habits.length > 0) {
    const today = todayKey();
    const incomplete = state.habits.filter(h => h.completedDate !== today).length;
    if (incomplete > 0) {
      const tick = Math.ceil(incomplete * 0.5);
      state.fear = Math.min(100, state.fear + tick);
      addLog(`The darkness grows... (+${tick} fear)`, 'fear-rise');
      saveState();
      render();
    }
  }
}, 5 * 60 * 1000);

// ===== Initialize =====

function init() {
  applyTimeFear();
  checkDailyReset();

  if (state.log.length === 0) {
    addLog('Your journey begins. Add rituals to hold back the dark.', 'rank-change');
  }

  saveState();
  render();
}

init();
