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
  initSteppers();
  registerSW();
});

// ===== カスタムステッパー =====
function initSteppers() {
  const configs = [
    { id: 'weightInput',      stepperStep: 0.1 },
    { id: 'walkSteps',        stepperStep: 500  },
    { id: 'exWeight',         stepperStep: 5    },
    { id: 'exReps',           stepperStep: 1    },
    { id: 'exSets',           stepperStep: 1    },
    { id: 'mealCalorie',      stepperStep: 50   },
    { id: 'targetSleepInput', stepperStep: 0.5  },
  ];
  configs.forEach(({ id, stepperStep }) => {
    const input = document.getElementById(id);
    if (!input) return;
    input._stepperStep = stepperStep;

    const btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.className = 'stepper-btn';
    btnMinus.textContent = '−';
    btnMinus.addEventListener('click', () => adjustStepper(input, -1));

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'stepper-btn';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => adjustStepper(input, 1));

    input.parentNode.insertBefore(btnMinus, input);
    input.after(btnPlus);
    input.classList.add('stepper-input');
  });
}

function adjustStepper(input, dir) {
  const step = input._stepperStep || 1;
  const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
  const max = input.max !== '' ? parseFloat(input.max) : Infinity;
  const current = parseFloat(input.value) || 0;
  const newVal = Math.min(max, Math.max(min, current + dir * step));
  const decimals = (step.toString().split('.')[1] || '').length;
  input.value = newVal.toFixed(decimals);
  input.dispatchEvent(new Event('input'));
}

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
  } else {
    // 身長未設定のときはアコーディオンを開いておく
    document.getElementById('heightAccordionBody').classList.add('open');
    document.getElementById('heightAccordionIcon').classList.add('open');
  }
  if (settings.targetCalorie) {
    document.getElementById('targetCalorieInput').value = settings.targetCalorie;
  }
  if (settings.targetSleep) {
    document.getElementById('targetSleepInput').value = settings.targetSleep;
  }
  // プロフィール
  document.getElementById('ageInput').value = settings.age || 37;
  document.getElementById('activityInput').value = settings.activityFactor || 1.3;
  document.getElementById('proteinRatioInput').value = settings.proteinRatio || 1.7;
  document.getElementById('fatRatioInput').value = settings.fatRatio || 1.0;
  updatePFCRecommend();
}

// ===== タブ切り替え =====
const TAB_ORDER = ['dashboard', 'weight', 'meal', 'exercise', 'sleep'];

function showTab(tabName) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'dashboard') {
    updateDashboard();
  }
}

function getCurrentTab() {
  const active = document.querySelector('.nav-btn.active');
  return active ? active.dataset.tab : 'dashboard';
}

// スワイプでタブ切り替え
(function() {
  let startX = 0;
  let startY = 0;
  const main = document.querySelector('.main-content');

  main.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    const current = TAB_ORDER.indexOf(getCurrentTab());
    if (dx < 0 && current < TAB_ORDER.length - 1) {
      showTab(TAB_ORDER[current + 1]);
    } else if (dx > 0 && current > 0) {
      showTab(TAB_ORDER[current - 1]);
    }
  }, { passive: true });
})();

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

// ===== 体重グラフ（カロリー棒グラフ重ね表示） =====
function updateWeightChart() {
  const weights = DB.get('weights');
  const meals = DB.get('meals');
  const today = getTodayStr();
  const days = 30;

  const labels = [];
  const weightData = [];
  const calorieData = [];

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateBefore(today, i);
    labels.push(formatDateShort(dateStr));
    const entry = weights.find(w => w.date === dateStr);
    weightData.push(entry ? entry.weight : null);
    const dayCalories = meals.filter(m => m.date === dateStr).reduce((s, m) => s + m.calorie, 0);
    calorieData.push(dayCalories > 0 ? dayCalories : null);
  }

  const ctx = document.getElementById('weightChart').getContext('2d');
  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'カロリー摂取 (kcal)',
          data: calorieData,
          backgroundColor: 'rgba(245,158,11,0.35)',
          borderColor: 'rgba(245,158,11,0.6)',
          borderWidth: 1,
          borderRadius: 3,
          yAxisID: 'yCalorie',
          order: 2
        },
        {
          type: 'line',
          label: '体重 (kg)',
          data: weightData,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.1)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#0ea5e9',
          fill: true,
          tension: 0.3,
          spanGaps: true,
          yAxisID: 'yWeight',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { font: { size: 11 }, boxWidth: 12 }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, font: { size: 10 } },
          grid: { display: false }
        },
        yWeight: {
          type: 'linear',
          position: 'left',
          ticks: { font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          title: { display: true, text: 'kg', font: { size: 10 } }
        },
        yCalorie: {
          type: 'linear',
          position: 'right',
          ticks: { font: { size: 10 } },
          grid: { display: false },
          title: { display: true, text: 'kcal', font: { size: 10 } }
        }
      }
    }
  });
}

// ===== カロリーグラフ（PFC積み上げ） =====
function updateCalorieChart() {
  const meals = DB.get('meals');
  const exercises = DB.get('exercises');
  const today = getTodayStr();
  const days = 7;

  const settings = DB.getObj('settings');
  const targetCalorie = settings.targetCalorie || null;

  const labels = [];
  const proteinKcal = [];
  const fatKcal = [];
  const carbKcal = [];
  const otherKcal = [];
  const burnData = [];
  const targetLine = [];

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateBefore(today, i);
    labels.push(formatDateShort(dateStr));
    const dayMeals = meals.filter(m => m.date === dateStr);
    const dayExercises = exercises.filter(e => e.date === dateStr);

    const totalCal = dayMeals.reduce((s, m) => s + m.calorie, 0);
    const pKcal = Math.round(dayMeals.reduce((s, m) => s + (m.protein || 0), 0) * 4);
    const fKcal = Math.round(dayMeals.reduce((s, m) => s + (m.fat || 0), 0) * 9);
    const cKcal = Math.round(dayMeals.reduce((s, m) => s + (m.carb || 0), 0) * 4);
    const other = Math.max(0, totalCal - pKcal - fKcal - cKcal);

    proteinKcal.push(pKcal || null);
    fatKcal.push(fKcal || null);
    carbKcal.push(cKcal || null);
    otherKcal.push(other > 0 ? other : (totalCal > 0 && pKcal === 0 && fKcal === 0 && cKcal === 0 ? totalCal : null));
    burnData.push(dayExercises.reduce((s, e) => s + e.calorie, 0) || null);
    targetLine.push(targetCalorie);
  }

  const ctx = document.getElementById('calorieChart').getContext('2d');
  if (calorieChart) calorieChart.destroy();

  calorieChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'タンパク質',
          data: proteinKcal,
          backgroundColor: 'rgba(14,165,233,0.75)',
          stack: 'intake'
        },
        {
          type: 'bar',
          label: '脂質',
          data: fatKcal,
          backgroundColor: 'rgba(245,158,11,0.75)',
          stack: 'intake'
        },
        {
          type: 'bar',
          label: '炭水化物',
          data: carbKcal,
          backgroundColor: 'rgba(34,197,94,0.75)',
          stack: 'intake'
        },
        {
          type: 'bar',
          label: 'その他',
          data: otherKcal,
          backgroundColor: 'rgba(148,163,184,0.5)',
          stack: 'intake'
        },
        {
          type: 'line',
          label: '運動消費',
          data: burnData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          tension: 0.3,
          spanGaps: true,
          yAxisID: 'yBurn'
        },
        {
          type: 'line',
          label: '目標カロリー',
          data: targetLine,
          borderColor: 'rgba(239,68,68,0.8)',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0,
          yAxisID: 'y',
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 10 }, boxWidth: 10, padding: 8 }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: { font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          min: 0
        },
        yBurn: {
          type: 'linear',
          position: 'right',
          ticks: { font: { size: 10 }, color: '#6366f1' },
          grid: { display: false },
          title: { display: true, text: '消費', font: { size: 9 }, color: '#6366f1' },
          min: 0
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

// ===== プロフィール設定 =====
function toggleProfileAccordion() {
  const body = document.getElementById('profileAccordionBody');
  const icon = document.getElementById('profileAccordionIcon');
  const isOpen = body.classList.toggle('open');
  icon.classList.toggle('open', isOpen);
}

function saveProfile() {
  const settings = DB.getObj('settings');
  settings.age = parseInt(document.getElementById('ageInput').value) || 37;
  settings.activityFactor = parseFloat(document.getElementById('activityInput').value) || 1.3;
  settings.proteinRatio = parseFloat(document.getElementById('proteinRatioInput').value) || 1.7;
  settings.fatRatio = parseFloat(document.getElementById('fatRatioInput').value) || 1.0;
  DB.set('settings', settings);
  showToast('✅ プロフィールを保存しました');
  updatePFCRecommend();
}

function updatePFCRecommend() {
  const settings = DB.getObj('settings');
  const weights = DB.get('weights');
  if (weights.length === 0 || !settings.height) return;

  const weight = weights[weights.length - 1].weight;
  const age = settings.age || 37;
  const activity = settings.activityFactor || 1.3;
  const proteinRatio = settings.proteinRatio || 1.7;
  const fatRatio = settings.fatRatio || 1.0;

  // Mifflin-St Jeor (男性)
  const bmr = 10 * weight + 6.25 * settings.height - 5 * age + 5;
  const tdee = Math.round(bmr * activity);
  const protein = Math.round(weight * proteinRatio);
  const fat = Math.round(weight * fatRatio);
  const carb = Math.max(Math.round((tdee - protein * 4 - fat * 9) / 4), 0);

  // 自動で目標に保存
  settings.targetCalorie = tdee;
  settings.targetProtein = protein;
  settings.targetFat = fat;
  settings.targetCarb = carb;
  DB.set('settings', settings);

  document.getElementById('pfcRecommendBox').style.display = 'block';
  document.getElementById('pfcTdee').textContent = `${tdee} kcal`;
  document.getElementById('pfcP').textContent = protein;
  document.getElementById('pfcF').textContent = fat;
  document.getElementById('pfcC').textContent = carb;

  updateCalorieProgress();
}

// ===== 体重管理 =====
function toggleHeightAccordion() {
  const body = document.getElementById('heightAccordionBody');
  const icon = document.getElementById('heightAccordionIcon');
  const isOpen = body.classList.toggle('open');
  icon.classList.toggle('open', isOpen);
}

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

  document.getElementById('weightInput').value = weight;
  showToast(`✅ ${weight}kg を記録しました`);
  updateBMIDisplay();
  renderWeightHistory();
  updatePFCRecommend();
}

function renderWeightHistory() {
  const weights = DB.get('weights');
  const container = document.getElementById('weightHistory');

  if (weights.length === 0) {
    container.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
    return;
  }

  const lastWeight = weights[weights.length - 1].weight;
  const input = document.getElementById('weightInput');
  if (!input.value) input.value = lastWeight;

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
  const todayMeals = meals.filter(m => m.date === today);
  const todayCalories = todayMeals.reduce((s, m) => s + m.calorie, 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const todayFat = todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
  const todayCarb = todayMeals.reduce((s, m) => s + (m.carb || 0), 0);
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
    text.textContent = `${todayCalories} kcal`;
  }

  // PFC進捗
  const tP = settings.targetProtein;
  const tF = settings.targetFat;
  const tC = settings.targetCarb;
  if (tP && tF && tC) {
    document.getElementById('pfcProgressList').style.display = 'flex';
    const setPFC = (fillId, textId, val, tgt) => {
      document.getElementById(fillId).style.width = Math.min((val / tgt) * 100, 100) + '%';
      document.getElementById(textId).textContent = `${val.toFixed(1)} / ${tgt}g`;
    };
    setPFC('pfcProgressFillP', 'pfcProgressTextP', todayProtein, tP);
    setPFC('pfcProgressFillF', 'pfcProgressTextF', todayFat, tF);
    setPFC('pfcProgressFillC', 'pfcProgressTextC', todayCarb, tC);
  }
}

function addMeal() {
  const name = document.getElementById('mealName').value.trim();
  const calorie = parseInt(document.getElementById('mealCalorie').value);
  const protein = parseFloat(document.getElementById('mealProtein').value) || 0;
  const fat = parseFloat(document.getElementById('mealFat').value) || 0;
  const carb = parseFloat(document.getElementById('mealCarb').value) || 0;
  const type = document.getElementById('mealType').value;
  const date = document.getElementById('mealDate').value;

  if (!name) { showToast('⚠️ 食事名を入力してください'); return; }
  if (!calorie || calorie < 0) { showToast('⚠️ カロリーを入力してください'); return; }
  if (!date) { showToast('⚠️ 日付を選択してください'); return; }

  const meals = DB.get('meals');
  meals.push({ id: Date.now(), date, name, calorie, protein, fat, carb, type });
  DB.set('meals', meals);

  document.getElementById('mealName').value = '';
  document.getElementById('mealCalorie').value = 300;
  document.getElementById('mealProtein').value = '';
  document.getElementById('mealFat').value = '';
  document.getElementById('mealCarb').value = '';
  showToast(`✅ ${name} (${calorie}kcal) を記録しました`);
  renderMealHistory();
  updateCalorieProgress();
}

function quickAdd(name, calorie, protein = 0, fat = 0, carb = 0) {
  document.getElementById('mealName').value = name;
  document.getElementById('mealCalorie').value = calorie;
  document.getElementById('mealProtein').value = protein;
  document.getElementById('mealFat').value = fat;
  document.getElementById('mealCarb').value = carb;
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
    const totalP = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const totalF = todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
    const totalC = todayMeals.reduce((s, m) => s + (m.carb || 0), 0);
    totalEl.textContent = `合計: ${total} kcal  P:${totalP.toFixed(1)}g F:${totalF.toFixed(1)}g C:${totalC.toFixed(1)}g`;
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
const WEIGHT_EXERCISE_COEFF = {
  'ラットプルダウン': 0.020,
  'チェストプレス':  0.020,
  'ショルダープレス': 0.018,
  'スクワット':      0.030,
  '腹筋ローラー':    null   // reps×sets×0.5 kcal (bodyweight)
};

const EXERCISE_DEFAULTS = {
  'ラットプルダウン':  { weight: 30, reps: 10, sets: 3 },
  'チェストプレス':    { weight: 40, reps: 10, sets: 3 },
  'ショルダープレス':  { weight: 10, reps: 10, sets: 3 },
  'スクワット':        { weight: 60, reps: 10, sets: 3 },
  '腹筋ローラー':      { weight: 0,  reps: 10, sets: 3 }
};

function onExerciseTypeChange() {
  const type = document.getElementById('exerciseType').value;
  const isWalking = type === 'ウォーキング';
  document.getElementById('exerciseForm-walking').style.display = isWalking ? '' : 'none';
  document.getElementById('exerciseForm-weights').style.display = isWalking ? 'none' : '';
  document.getElementById('exerciseCalorieValue').textContent = '-- kcal';
  document.getElementById('exerciseCalorie').value = '';

  if (!isWalking) {
    const def = EXERCISE_DEFAULTS[type] || { weight: 30, reps: 10, sets: 3 };
    document.getElementById('exWeight').value = def.weight || '';
    document.getElementById('exReps').value = def.reps;
    document.getElementById('exSets').value = def.sets;
    calcWeightCalories();
  }
}

function calcWalkCalories() {
  const steps = parseInt(document.getElementById('walkSteps').value) || 0;
  const weights = DB.get('weights');
  const bw = weights.length > 0 ? weights[weights.length - 1].weight : 65;
  const kcal = Math.round(steps * bw * 0.0004);
  document.getElementById('exerciseCalorieValue').textContent = kcal > 0 ? `${kcal} kcal` : '-- kcal';
  document.getElementById('exerciseCalorie').value = kcal > 0 ? kcal : '';
}

function calcWeightCalories() {
  const type = document.getElementById('exerciseType').value;
  const w = parseFloat(document.getElementById('exWeight').value) || 0;
  const r = parseInt(document.getElementById('exReps').value) || 0;
  const s = parseInt(document.getElementById('exSets').value) || 0;
  if (s === 0) { document.getElementById('exerciseCalorieValue').textContent = '-- kcal'; return; }

  let kcal;
  if (type === '腹筋ローラー') {
    kcal = Math.round(r * s * 0.5);
  } else {
    const coeff = WEIGHT_EXERCISE_COEFF[type] || 0.020;
    kcal = Math.round(w * r * s * coeff);
  }
  document.getElementById('exerciseCalorieValue').textContent = kcal > 0 ? `${kcal} kcal` : '-- kcal';
  document.getElementById('exerciseCalorie').value = kcal > 0 ? kcal : '';
}

function addExercise() {
  const type = document.getElementById('exerciseType').value;
  const calorie = parseInt(document.getElementById('exerciseCalorie').value);
  const memo = document.getElementById('exerciseMemo').value.trim();
  const date = document.getElementById('exerciseDate').value;

  if (!calorie || calorie < 0) { showToast('⚠️ 値を入力してください'); return; }
  if (!date) { showToast('⚠️ 日付を選択してください'); return; }

  let detail = '';
  if (type === 'ウォーキング') {
    const steps = parseInt(document.getElementById('walkSteps').value) || 0;
    detail = `${steps.toLocaleString()}歩`;
  } else if (type === '腹筋ローラー') {
    const r = document.getElementById('exReps').value;
    const s = document.getElementById('exSets').value;
    detail = `${r}回×${s}セット`;
  } else {
    const w = document.getElementById('exWeight').value;
    const r = document.getElementById('exReps').value;
    const s = document.getElementById('exSets').value;
    detail = `${w}kg×${r}回×${s}セット`;
  }

  const exercises = DB.get('exercises');
  exercises.push({ id: Date.now(), date, type, detail, calorie, memo });
  DB.set('exercises', exercises);

  document.getElementById('walkSteps').value = '8000';
  document.getElementById('exerciseMemo').value = '';
  document.getElementById('exerciseCalorie').value = '';
  document.getElementById('exerciseCalorieValue').textContent = '-- kcal';
  const def = EXERCISE_DEFAULTS[type] || { weight: 30, reps: 10, sets: 3 };
  document.getElementById('exWeight').value = def.weight || '';
  document.getElementById('exReps').value = def.reps;
  document.getElementById('exSets').value = def.sets;
  calcWeightCalories();
  showToast(`✅ ${type} ${detail} を記録しました`);
  renderExerciseHistory();
}

function exerciseSubLabel(e) {
  const parts = [];
  if (e.detail) parts.push(e.detail);
  if (e.memo) parts.push(e.memo);
  // 旧データ互換
  if (!e.detail && e.duration) parts.push(`${e.duration}分`);
  return parts.join(' · ');
}

function renderExerciseHistory() {
  const today = getTodayStr();
  const exercises = DB.get('exercises');

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
          <div class="history-item-sub">${exerciseSubLabel(e)}</div>
        </div>
        <div class="history-item-value">${e.calorie} kcal</div>
        <button class="btn-delete" onclick="deleteExercise(${e.id})">削除</button>
      </div>
    `).join('');
    totalEl.textContent = `合計消費: ${total} kcal`;
  }

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
