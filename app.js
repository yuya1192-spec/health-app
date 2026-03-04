// ===== 健康管理アプリ メインスクリプト =====

// ===== データ管理 =====
const DB = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
  },
  getObj(key, def = {}) {
    try {
      return JSON.parse(localStorage.getItem(key)) || def;
    } catch { return def; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// ===== 状態 =====
let selectedQuality = 3;
let weightChart = null;
let calorieChart = null;
let sleepChart = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  initDates();
  loadSettings();
  updateDashboard();
  renderWeightHistory();
  renderMealHistory();
  renderExerciseHistory();
  renderSleepHistory();
  updateSleepPreview();
  registerSW();
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ===== 日付初期化 =====
function initDates() {
  const today = getTodayStr();
  document.getElementById('todayDate').textContent = formatDateJP(today);
  document.getElementById('weightDate').value = today;
  document.getElementById('mealDate').value = today;
  document.getElementById('exerciseDate').value = today;
  document.getElementById('sleepDate').value = today;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateJP(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth()+1}/${d.getDate()}`;
}

// ===== 設定読み込み =====
function loadSettings() {
  const settings = DB.getObj('settings');
  if (settings.height) {
    document.getElementById('heightInput').value = settings.height;
  }
  if (settings.targetCalorie) {
    document.getElementById('targetCalorieInput').value = settings.targetCalorie;
  }
  if (settings.targetSleep) {
    document.getElementById('targetSleepInput').value = settings.targetSleep;
  }
}

// ===== タブ切り替え =====
function showTab(tabName) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'dashboard') {
    updateDashboard();
  }
}

// ===== トースト通知 =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== ダッシュボード更新 =====
function updateDashboard() {
  const today = getTodayStr();
  const yesterday = getDateBefore(today, 1);

  // 体重・BMI
  const weights = DB.get('weights');
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const settings = DB.getObj('settings');

  if (latestWeight) {
    document.getElementById('dash-weight').textContent = latestWeight.weight;
    if (settings.height) {
      const bmi = calcBMI(latestWeight.weight, settings.height);
      document.getElementById('dash-bmi').textContent = bmi.value;
      document.getElementById('dash-bmi-label').textContent = bmi.label;
    }
  }

  // 今日のカロリー摂取
  const meals = DB.get('meals');
  const todayMeals = meals.filter(m => m.date === today);
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calorie, 0);
  document.getElementById('dash-calories').textContent = todayCalories;

  // 今日の運動消費
  const exercises = DB.get('exercises');
  const todayExercises = exercises.filter(e => e.date === today);
  const todayExerciseCalories = todayExercises.reduce((sum, e) => sum + e.calorie, 0);
  document.getElementById('dash-exercise').textContent = todayExerciseCalories;

  // カロリー収支
  const balance = todayCalories - todayExerciseCalories;
  document.getElementById('dash-balance').textContent = Math.abs(balance);
  document.getElementById('dash-balance-label').textContent = balance >= 0 ? '摂取超過' : '消費超過';

  // 昨夜の睡眠
  const sleeps = DB.get('sleeps');
  const lastSleep = sleeps.find(s => s.date === today) || sleeps.find(s => s.date === yesterday);
  if (lastSleep) {
    document.getElementById('dash-sleep').textContent = lastSleep.duration.toFixed(1);
  }

  // グラフ更新
  updateWeightChart();
  updateCalorieChart();
  updateSleepChart();
}

function getDateBefore(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ===== 体重グラフ =====
function updateWeightChart() {
  const weights = DB.get('weights');
  const today = getTodayStr();
  const days = 30;

  const labels = [];
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateBefore(today, i);
    labels.push(formatDateShort(dateStr));
    const entry = weights.find(w => w.date === dateStr);
    data.push(entry ? entry.weight : null);
  }

  const ctx = document.getElementById('weightChart').getContext('2d');
  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '体重 (kg)',
        data,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.1)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#0ea5e9',
        fill: true,
        tension: 0.3,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  });
}

// ===== カロリーグラフ =====
function updateCalorieChart() {
  const meals = DB.get('meals');
  const exercises = DB.get('exercises');
  const today = getTodayStr();
  const days = 7;

  const labels = [];
  const intakeData = [];
  const burnData = [];

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateBefore(today, i);
    labels.push(formatDateShort(dateStr));
    const dayMeals = meals.filter(m => m.date === dateStr);
    const dayExercises = exercises.filter(e => e.date === dateStr);
    intakeData.push(dayMeals.reduce((s, m) => s + m.calorie, 0));
    burnData.push(dayExercises.reduce((s, e) => s + e.calorie, 0));
  }

  const ctx = document.getElementById('calorieChart').getContext('2d');
  if (calorieChart) calorieChart.destroy();

  calorieChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '摂取',
          data: intakeData,
          backgroundColor: 'rgba(245,158,11,0.7)',
          borderRadius: 6
        },
        {
          label: '消費',
          data: burnData,
          backgroundColor: 'rgba(34,197,94,0.7)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11 }, boxWidth: 12 }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  });
}

// ===== 睡眠グラフ =====
function updateSleepChart() {
  const sleeps = DB.get('sleeps');
  const today = getTodayStr();
  const days = 7;

  const labels = [];
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateBefore(today, i);
    labels.push(formatDateShort(dateStr));
    const entry = sleeps.find(s => s.date === dateStr);
    data.push(entry ? entry.duration : null);
  }

  const ctx = document.getElementById('sleepChart').getContext('2d');
  if (sleepChart) sleepChart.destroy();

  sleepChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '睡眠時間 (h)',
        data,
        backgroundColor: data.map(v => {
          if (v === null) return 'rgba(0,0,0,0.05)';
          if (v >= 7) return 'rgba(99,102,241,0.7)';
          if (v >= 6) return 'rgba(245,158,11,0.7)';
          return 'rgba(239,68,68,0.7)';
        }),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          min: 0,
          max: 12,
          ticks: { font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  });
}

// ===== 体重管理 =====
function saveHeight() {
  const val = parseFloat(document.getElementById('heightInput').value);
  if (!val || val < 100 || val > 250) {
    showToast('⚠️ 正しい身長を入力してください');
    return;
  }
  const settings = DB.getObj('settings');
  settings.height = val;
  DB.set('settings', settings);
  showToast('✅ 身長を保存しました');
  updateBMIDisplay();
}

function calcBMI(weight, height) {
  const h = height / 100;
  const bmi = weight / (h * h);
  let label, color;
  if (bmi < 18.5) { label = '痩せ型'; color = '#1e40af'; }
  else if (bmi < 25) { label = '普通体重'; color = '#166534'; }
  else if (bmi < 30) { label = '過体重'; color = '#92400e'; }
  else { label = '肥満'; color = '#991b1b'; }
  return { value: bmi.toFixed(1), label, color };
}

function updateBMIDisplay() {
  const settings = DB.getObj('settings');
  const weights = DB.get('weights');
  if (!settings.height || weights.length === 0) return;

  const latest = weights[weights.length - 1];
  const bmi = calcBMI(latest.weight, settings.height);

  document.getElementById('bmiDisplay').style.display = 'block';
  document.getElementById('bmiValueLarge').textContent = bmi.value;
  document.getElementById('bmiValueLarge').style.color = bmi.color;
  document.getElementById('bmiLabelLarge').textContent = bmi.label;
  document.getElementById('bmiLabelLarge').style.color = bmi.color;
}

function addWeight() {
  const weight = parseFloat(document.getElementById('weightInput').value);
  const date = document.getElementById('weightDate').value;

  if (!weight || weight < 20 || weight > 300) {
    showToast('⚠️ 正しい体重を入力してください');
    return;
  }
  if (!date) {
    showToast('⚠️ 日付を選択してください');
    return;
  }

  const weights = DB.get('weights');
  // 同じ日付があれば上書き
  const idx = weights.findIndex(w => w.date === date);
  if (idx >= 0) {
    weights[idx].weight = weight;
  } else {
    weights.push({ date, weight, id: Date.now() });
    weights.sort((a, b) => a.date.localeCompare(b.date));
  }
  DB.set('weights', weights);

  document.getElementById('weightInput').value = '';
  showToast(`✅ ${weight}kg を記録しました`);
  updateBMIDisplay();
  renderWeightHistory();
}

function renderWeightHistory() {
  const weights = DB.get('weights');
  const container = document.getElementById('weightHistory');

  if (weights.length === 0) {
    container.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
    return;
  }

  const sorted = [...weights].reverse();
  container.innerHTML = sorted.map(w => `
    <div class="history-item">
      <div class="history-item-info">
        <div class="history-item-main">${formatDateJP(w.date)}</div>
        <div class="history-item-sub">${getBMIText(w.weight)}</div>
      </div>
      <div class="history-item-value">${w.weight} kg</div>
      <button class="btn-delete" onclick="deleteWeight(${w.id})">削除</button>
    </div>
  `).join('');
}

function getBMIText(weight) {
  const settings = DB.getObj('settings');
  if (!settings.height) return '身長を設定してください';
  const bmi = calcBMI(weight, settings.height);
  return `BMI: ${bmi.value} (${bmi.label})`;
}

function deleteWeight(id) {
  let weights = DB.get('weights');
  weights = weights.filter(w => w.id !== id);
  DB.set('weights', weights);
  renderWeightHistory();
  updateBMIDisplay();
  showToast('🗑️ 削除しました');
}

// ===== 食事管理 =====
function saveTargetCalorie() {
  const val = parseInt(document.getElementById('targetCalorieInput').value);
  if (!val || val < 500 || val > 5000) {
    showToast('⚠️ 正しい目標カロリーを入力してください');
    return;
  }
  const settings = DB.getObj('settings');
  settings.targetCalorie = val;
  DB.set('settings', settings);
  showToast('✅ 目標カロリーを保存しました');
  updateCalorieProgress();
}

function updateCalorieProgress() {
  const today = getTodayStr();
  const meals = DB.get('meals');
  const todayCalories = meals.filter(m => m.date === today).reduce((s, m) => s + m.calorie, 0);
  const settings = DB.getObj('settings');
  const target = settings.targetCalorie || 0;

  const fill = document.getElementById('calorieProgressFill');
  const text = document.getElementById('calorieProgressText');

  if (target > 0) {
    const pct = Math.min((todayCalories / target) * 100, 100);
    fill.style.width = pct + '%';
    fill.classList.toggle('over', todayCalories > target);
    text.textContent = `${todayCalories} / ${target} kcal`;
  } else {
    fill.style.width = '0%';
    text.textContent = `${todayCalories} / 未設定 kcal`;
  }
}

function addMeal() {
  const name = document.getElementById('mealName').value.trim();
  const calorie = parseInt(document.getElementById('mealCalorie').value);
  const type = document.getElementById('mealType').value;
  const date = document.getElementById('mealDate').value;

  if (!name) {
    showToast('⚠️ 食事名を入力してください');
    return;
  }
  if (!calorie || calorie < 0) {
    showToast('⚠️ カロリーを入力してください');
    return;
  }
  if (!date) {
    showToast('⚠️ 日付を選択してください');
    return;
  }

  const meals = DB.get('meals');
  meals.push({ id: Date.now(), date, name, calorie, type });
  DB.set('meals', meals);

  document.getElementById('mealName').value = '';
  document.getElementById('mealCalorie').value = '';
  showToast(`✅ ${name} (${calorie}kcal) を記録しました`);
  renderMealHistory();
  updateCalorieProgress();
}

function quickAdd(name, calorie) {
  document.getElementById('mealName').value = name;
  document.getElementById('mealCalorie').value = calorie;
  showToast(`📝 ${name} をセットしました`);
}

function renderMealHistory() {
  const today = getTodayStr();
  const meals = DB.get('meals');

  // 今日の食事
  const todayMeals = meals.filter(m => m.date === today);
  const todayContainer = document.getElementById('todayMeals');
  const totalEl = document.getElementById('todayTotalCalories');

  if (todayMeals.length === 0) {
    todayContainer.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
    totalEl.textContent = '合計: 0 kcal';
  } else {
    const total = todayMeals.reduce((s, m) => s + m.calorie, 0);
    todayContainer.innerHTML = todayMeals.map(m => `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-main">${m.name}</div>
          <div class="history-item-sub">${m.type}</div>
        </div>
        <div class="history-item-value">${m.calorie} kcal</div>
        <button class="btn-delete" onclick="deleteMeal(${m.id})">削除</button>
      </div>
    `).join('');
    totalEl.textContent = `合計: ${total} kcal`;
  }

  // 過去の記録（今日以外）
  const pastMeals = meals.filter(m => m.date !== today).reverse();
  const histContainer = document.getElementById('mealHistory');

  if (pastMeals.length === 0) {
    histContainer.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
  } else {
    // 日付ごとにグループ化
    const grouped = {};
    pastMeals.forEach(m => {
      if (!grouped[m.date]) grouped[m.date] = [];
      grouped[m.date].push(m);
    });

    histContainer.innerHTML = Object.entries(grouped).map(([date, items]) => {
      const total = items.reduce((s, m) => s + m.calorie, 0);
      return `
        <div class="history-item">
          <div class="history-item-info">
            <div class="history-item-main">${formatDateJP(date)}</div>
            <div class="history-item-sub">${items.map(m => m.name).join('、')}</div>
          </div>
          <div class="history-item-value">${total} kcal</div>
        </div>
      `;
    }).join('');
  }

  updateCalorieProgress();
}

function deleteMeal(id) {
  let meals = DB.get('meals');
  meals = meals.filter(m => m.id !== id);
  DB.set('meals', meals);
  renderMealHistory();
  showToast('🗑️ 削除しました');
}

// ===== 運動管理 =====
function addExercise() {
  const type = document.getElementById('exerciseType').value;
  const duration = parseInt(document.getElementById('exerciseDuration').value);
  const calorie = parseInt(document.getElementById('exerciseCalorie').value);
  const memo = document.getElementById('exerciseMemo').value.trim();
  const date = document.getElementById('exerciseDate').value;

  if (!duration || duration < 1) {
    showToast('⚠️ 運動時間を入力してください');
    return;
  }
  if (!calorie && calorie !== 0) {
    showToast('⚠️ 消費カロリーを入力してください');
    return;
  }
  if (!date) {
    showToast('⚠️ 日付を選択してください');
    return;
  }

  const exercises = DB.get('exercises');
  exercises.push({ id: Date.now(), date, type, duration, calorie, memo });
  DB.set('exercises', exercises);

  document.getElementById('exerciseDuration').value = '';
  document.getElementById('exerciseCalorie').value = '';
  document.getElementById('exerciseMemo').value = '';
  showToast(`✅ ${type} ${duration}分 を記録しました`);
  renderExerciseHistory();
}

function renderExerciseHistory() {
  const today = getTodayStr();
  const exercises = DB.get('exercises');

  // 今日の運動
  const todayExercises = exercises.filter(e => e.date === today);
  const todayContainer = document.getElementById('todayExercises');
  const totalEl = document.getElementById('todayTotalExercise');

  if (todayExercises.length === 0) {
    todayContainer.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
    totalEl.textContent = '合計消費: 0 kcal';
  } else {
    const total = todayExercises.reduce((s, e) => s + e.calorie, 0);
    todayContainer.innerHTML = todayExercises.map(e => `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-main">${e.type}</div>
          <div class="history-item-sub">${e.duration}分${e.memo ? ' · ' + e.memo : ''}</div>
        </div>
        <div class="history-item-value">${e.calorie} kcal</div>
        <button class="btn-delete" onclick="deleteExercise(${e.id})">削除</button>
      </div>
    `).join('');
    totalEl.textContent = `合計消費: ${total} kcal`;
  }

  // 過去の記録
  const pastExercises = exercises.filter(e => e.date !== today).reverse();
  const histContainer = document.getElementById('exerciseHistory');

  if (pastExercises.length === 0) {
    histContainer.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
  } else {
    const grouped = {};
    pastExercises.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });

    histContainer.innerHTML = Object.entries(grouped).map(([date, items]) => {
      const total = items.reduce((s, e) => s + e.calorie, 0);
      return `
        <div class="history-item">
          <div class="history-item-info">
            <div class="history-item-main">${formatDateJP(date)}</div>
            <div class="history-item-sub">${items.map(e => e.type).join('、')}</div>
          </div>
          <div class="history-item-value">${total} kcal</div>
        </div>
      `;
    }).join('');
  }
}

function deleteExercise(id) {
  let exercises = DB.get('exercises');
  exercises = exercises.filter(e => e.id !== id);
  DB.set('exercises', exercises);
  renderExerciseHistory();
  showToast('🗑️ 削除しました');
}

// ===== 睡眠管理 =====
function saveTargetSleep() {
  const val = parseFloat(document.getElementById('targetSleepInput').value);
  if (!val || val < 4 || val > 12) {
    showToast('⚠️ 正しい目標睡眠時間を入力してください');
    return;
  }
  const settings = DB.getObj('settings');
  settings.targetSleep = val;
  DB.set('settings', settings);
  showToast('✅ 目標睡眠時間を保存しました');
}

function selectQuality(q) {
  selectedQuality = q;
  document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.quality) === q);
  });
}

function updateSleepPreview() {
  const start = document.getElementById('sleepStart').value;
  const end = document.getElementById('sleepEnd').value;
  const preview = document.getElementById('sleepDurationPreview');

  if (start && end) {
    const duration = calcSleepDuration(start, end);
    preview.textContent = `睡眠時間: ${duration.toFixed(1)} 時間`;
  }
}

// 就寝・起床時刻の変更を監視
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sleepStart').addEventListener('change', updateSleepPreview);
  document.getElementById('sleepEnd').addEventListener('change', updateSleepPreview);
});

function calcSleepDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // 日をまたぐ場合
  return (endMin - startMin) / 60;
}

function addSleep() {
  const start = document.getElementById('sleepStart').value;
  const end = document.getElementById('sleepEnd').value;
  const date = document.getElementById('sleepDate').value;

  if (!start || !end) {
    showToast('⚠️ 就寝・起床時刻を入力してください');
    return;
  }
  if (!date) {
    showToast('⚠️ 日付を選択してください');
    return;
  }

  const duration = calcSleepDuration(start, end);
  if (duration < 0.5 || duration > 24) {
    showToast('⚠️ 正しい時刻を入力してください');
    return;
  }

  const sleeps = DB.get('sleeps');
  // 同じ日付があれば上書き
  const idx = sleeps.findIndex(s => s.date === date);
  const entry = { id: Date.now(), date, start, end, duration, quality: selectedQuality };
  if (idx >= 0) {
    sleeps[idx] = { ...sleeps[idx], ...entry };
  } else {
    sleeps.push(entry);
    sleeps.sort((a, b) => a.date.localeCompare(b.date));
  }
  DB.set('sleeps', sleeps);

  showToast(`✅ ${duration.toFixed(1)}時間の睡眠を記録しました`);
  renderSleepHistory();
  updateSleepStats();
}

function renderSleepHistory() {
  const sleeps = DB.get('sleeps');
  const container = document.getElementById('sleepHistory');

  if (sleeps.length === 0) {
    container.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
    return;
  }

  const qualityEmoji = ['', '😫', '😕', '😐', '😊', '😄'];
  const sorted = [...sleeps].reverse();

  container.innerHTML = sorted.map(s => `
    <div class="history-item">
      <div class="history-item-info">
        <div class="history-item-main">${formatDateJP(s.date)}</div>
        <div class="history-item-sub">${s.start} → ${s.end} ${qualityEmoji[s.quality] || ''}</div>
      </div>
      <div class="history-item-value">${s.duration.toFixed(1)}h</div>
      <button class="btn-delete" onclick="deleteSleep(${s.id})">削除</button>
    </div>
  `).join('');

  updateSleepStats();
}

function updateSleepStats() {
  const sleeps = DB.get('sleeps');
  const today = getTodayStr();
  const recent = [];

  for (let i = 0; i < 7; i++) {
    const dateStr = getDateBefore(today, i);
    const entry = sleeps.find(s => s.date === dateStr);
    if (entry) recent.push(entry);
  }

  if (recent.length === 0) {
    document.getElementById('avgSleep').textContent = '--';
    document.getElementById('avgQuality').textContent = '--';
    return;
  }

  const avgDuration = recent.reduce((s, e) => s + e.duration, 0) / recent.length;
  const avgQuality = recent.reduce((s, e) => s + e.quality, 0) / recent.length;
  const qualityEmoji = ['', '😫', '😕', '😐', '😊', '😄'];

  document.getElementById('avgSleep').textContent = avgDuration.toFixed(1) + 'h';
  document.getElementById('avgQuality').textContent = qualityEmoji[Math.round(avgQuality)] || avgQuality.toFixed(1);
}

function deleteSleep(id) {
  let sleeps = DB.get('sleeps');
  sleeps = sleeps.filter(s => s.id !== id);
  DB.set('sleeps', sleeps);
  renderSleepHistory();
  showToast('🗑️ 削除しました');
}
