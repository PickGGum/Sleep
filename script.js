const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let rotation = 0;
let spinning = false;

const palette = Array.from({ length: 30 }, (_, i) => `hsl(${(i * 12) % 360}, 80%, 60%)`).concat(['#000000', '#ffffff']);

let options = Array.from({ length: 30 }, (_, i) => ({
  name: `${i + 1}`,
  probability: 999,
  color: palette[i]
}));

const resultDiv = document.getElementById('result');
const wheelEl = document.getElementById('wheel');

function drawWheel(highlightIndex = -1, blink = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const total = options.reduce((sum, o) => sum + o.probability, 0);
  let startAngle = -Math.PI / 2;

  options.forEach((opt, i) => {
    const sliceAngle = (opt.probability / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(300, 300);
    ctx.arc(300, 300, 300, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = opt.color;
    ctx.fill();

    if (i === highlightIndex && blink) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(300, 300);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.fillStyle = "#fff";
    ctx.font = '16px Nanum Gothic';
    ctx.textAlign = 'right';
    ctx.fillText(opt.name, 280, 10);
    ctx.restore();

    startAngle += sliceAngle;
  });
}

function pickByProbability() {
  const total = options.reduce((sum, opt) => sum + opt.probability, 0);
  let r = Math.random() * total, acc = 0;
  for (const opt of options) {
    acc += opt.probability;
    if (r <= acc) return opt;
  }
  return options[options.length - 1];
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  const total = options.reduce((sum, o) => sum + o.probability, 0);
  const target = pickByProbability();

  let angle = -90;
  for (let i = 0; i < options.length; i++) {
    const a = (options[i].probability / total) * 360;
    if (options[i] === target) break;
    angle += a;
  }
  const slice = (target.probability / total) * 360;
  const offset = (Math.random() - 0.5) * slice * 0.5;
  const targetAngle = angle + slice / 2 + offset;
  const fullSpins = 5 * 360;
  const newRotation = fullSpins + (360 - targetAngle);
  rotation += newRotation;
  wheelEl.style.transform = `rotate(${rotation}deg)`;

  setTimeout(() => {
    const finalAngle = (360 - (rotation % 360)) % 360;
    let acc = 0;
    let resultIndex = -1;
    for (let i = 0; i < options.length; i++) {
      const slice = (options[i].probability / total) * 360;
      if (finalAngle >= acc && finalAngle < acc + slice) {
        resultIndex = i;
        break;
      }
      acc += slice;
    }
    resultDiv.textContent = `결과: ${options[resultIndex].name}`;
    let blink = false, count = 0;
    const interval = setInterval(() => {
      blink = !blink;
      drawWheel(resultIndex, blink);
      if (++count >= 6) {
        clearInterval(interval);
        drawWheel();
      }
    }, 500);
    spinning = false;
  }, 5000);
}

function resetToDefault() {
  options = Array.from({ length: 30 }, (_, i) => ({
    name: `${i + 1}`,
    probability: 999,
    color: palette[i % palette.length]
  }));
  createSettingsForm();
  drawWheel();
}


function createSettingsForm() {
  const settingsDiv = document.getElementById('settings');
  settingsDiv.innerHTML = '';
  options.forEach((opt, i) => {
    const row = document.createElement('div');
    row.className = 'option-setting';
    row.setAttribute('data-index', i);

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '≡';

    const name = document.createElement('input');
    name.type = 'text';
    name.value = opt.name;
    name.oninput = e => {
      opt.name = e.target.value.trim();
      if (!opt.name) e.target.style.border = '2px solid red';
      else e.target.style.border = '';
      drawWheel();
    };

    const prob = document.createElement('input');
    prob.type = 'number';
    prob.value = opt.probability;
    prob.min = 1;
    prob.max = 999;
    prob.oninput = e => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 1) {
        e.target.style.border = '2px solid red';
        opt.probability = 1;
      } else {
        e.target.style.border = '';
        opt.probability = val;
      }
      drawWheel();
    };

    const color = document.createElement('select');
    palette.forEach(colorCode => {
      const o = document.createElement('option');
      o.value = colorCode;
      o.style.backgroundColor = colorCode;
      if (colorCode === opt.color) o.selected = true;
      color.appendChild(o);
    });

    const colorPreview = document.createElement('div');
    colorPreview.style.width = '24px';
    colorPreview.style.height = '24px';
    colorPreview.style.border = '1px solid #888';
    colorPreview.style.marginLeft = '6px';
    colorPreview.style.borderRadius = '4px';
    colorPreview.style.backgroundColor = opt.color;

    color.onchange = e => {
      opt.color = e.target.value;
      colorPreview.style.backgroundColor = opt.color;
      drawWheel();
    };

    const del = document.createElement('button');
    del.textContent = '삭제';
    del.onclick = () => {
      options.splice(i, 1);
      createSettingsForm();
      if (!options || options.length === 0) {
        resetToDefault();
      }
      drawWheel();
    };

    row.append(dragHandle, name, prob, color, colorPreview, del);
    settingsDiv.appendChild(row);
  });

  Sortable.create(settingsDiv, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: function (evt) {
      const [movedItem] = options.splice(evt.oldIndex, 1);
      options.splice(evt.newIndex, 0, movedItem);
      createSettingsForm();
      drawWheel();
    }
  });
}

function getNextColor() {
  if (options.length === 0) return palette[0];
  const last = options[options.length - 1].color;
  const idx = palette.indexOf(last);
  return palette[(idx + 1) % palette.length];
}

document.getElementById('spinButton').onclick = spinWheel;
document.getElementById('openSettings').onclick = () => {
  document.getElementById('settingsModal').style.display = 'flex';
  createSettingsForm();
};
document.getElementById('addOption').onclick = () => {
  options.push({ name: `${options.length + 1}`, probability: 999, color: getNextColor() });
  createSettingsForm();
  drawWheel();
};
document.getElementById('saveSettings').onclick = () => {
  localStorage.setItem('rouletteOptions', JSON.stringify(options));
  alert('저장됨!');
};
document.getElementById('loadSettings').onclick = () => {
  const saved = localStorage.getItem('rouletteOptions');
  if (!saved) return alert('없어요');
  try {
    options = JSON.parse(saved);
    createSettingsForm();
    drawWheel();
  } catch {
    alert('불러오기 실패');
  }
};
document.getElementById('resetToDefault').onclick = () => {
  options = Array.from({ length: 30 }, (_, i) => ({
    name: `${i + 1}`, probability: 999, color: palette[i % palette.length]
  }));
  createSettingsForm();
  drawWheel();
};
document.getElementById('darkModeToggle').onchange = e => {
  document.body.classList.toggle('dark', e.target.checked);
};
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('settingsModal').style.display = 'none';
  }
});

function createSlotControls() {
  const slotsDiv = document.getElementById('slots');
  slotsDiv.innerHTML = '';

  for (let i = 1; i <= 6; i++) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.marginBottom = '8px';

    const label = document.createElement('span');
    label.textContent = `슬롯 ${i}번`;

    row.appendChild(label); // ✅ 텍스트는 별도 span으로

    ['저장', '불러오기', '초기화'].forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action;
      btn.onclick = () => {
        const key = `slot${i}`;
        if (action === '저장') {
          localStorage.setItem(key, JSON.stringify(options));
          alert(`${key} 저장됨`);
        } else if (action === '불러오기') {
          const data = localStorage.getItem(key);
          if (data) {
            options = JSON.parse(data);
            drawWheel(); createSettingsForm();
            alert(`${key} 불러옴`);
          } else {
            alert('없음');
          }
        } else if (action === '초기화') {
          options = Array.from({ length: 30 }, (_, i) => ({
            name: `${i + 1}`, probability: 999, color: palette[i % palette.length]
          }));
          localStorage.setItem(key, JSON.stringify(options));
          drawWheel(); createSettingsForm();
          alert(`${key} 초기화`);
        }
      };
      row.appendChild(btn);
    });

    slotsDiv.appendChild(row);
  }
}

createSlotControls();
drawWheel();
