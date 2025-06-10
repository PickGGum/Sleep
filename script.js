const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  let rotation = 0;
  let spinning = false;

  let options = Array.from({ length: 30 }, (_, i) => ({
    name: `${i + 1}`,
    probability: 999,
    color: `hsl(${(i * 12) % 360}, 80%, 60%)`
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
      ctx.font = '16px Arial';
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

  function getNextColor() {
    if (options.length === 0) return '#cccccc';
    const last = options[options.length-1].color;
    const hue = parseInt(last.match(/hsl\((\d+),/)[1]);
    return `hsl(${(hue+30)%360},80%,60%)`;
  }

  function createSettingsForm() {
    const settingsDiv = document.getElementById('settings');
    settingsDiv.innerHTML = '';
    options.forEach((opt, i) => {
      const row = document.createElement('div');
      row.className = 'option-setting';

      const name = document.createElement('input');
      name.type = 'text';
      name.value = opt.name;
      name.oninput = e => { opt.name = e.target.value; drawWheel(); };

      const prob = document.createElement('input');
      prob.type = 'number';
      prob.value = opt.probability;
      prob.oninput = e => { opt.probability = parseInt(e.target.value) || 0; drawWheel(); };

      const color = document.createElement('input');
      color.type = 'color';
      color.value = opt.color;
      color.oninput = e => { opt.color = e.target.value; drawWheel(); };

      const del = document.createElement('button');
      del.textContent = '삭제';
      del.onclick = () => {
        options.splice(i, 1);
        createSettingsForm(); drawWheel();
      };

      row.append(name, prob, color, del);
      settingsDiv.appendChild(row);
    });
  }

  document.getElementById('spinButton').onclick = spinWheel;
  document.getElementById('openSettings').onclick = () => {
    document.getElementById('settingsModal').style.display = 'flex';
    createSettingsForm();
  };
  document.getElementById('addOption').onclick = () => {
    options.push({ name: `${options.length + 1}`, probability: 999, color: getNextColor() });
    createSettingsForm(); drawWheel();
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
      createSettingsForm(); drawWheel();
    } catch {
      alert('불러오기 실패');
    }
  };
  document.getElementById('resetToDefault').onclick = () => {
    options = Array.from({ length: 30 }, (_, i) => ({
      name: `${i + 1}`, probability: 999, color: `hsl(${(i * 12) % 360}, 80%, 60%)`
    }));
    createSettingsForm(); drawWheel();
  };
  document.getElementById('darkModeToggle').onchange = e => {
    document.body.classList.toggle('dark', e.target.checked);
  };

  function createSlotControls() {
    const slotsDiv = document.getElementById('slots');
    slotsDiv.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      const row = document.createElement('div');
      row.innerHTML = `슬롯 ${i}번`;
      ['저장', '불러오기', '초기화'].forEach(action => {
        const btn = document.createElement('button');
        btn.textContent = action;
        btn.onclick = () => {
          const key = `slot${i}`;
          if (action === '저장') {
            localStorage.setItem(key, JSON.stringify(options));
            alert(`${key}을(를) 저장했습니다.`);
          } else if (action === '불러오기') {
            const data = localStorage.getItem(key);
            if (data) {
              options = JSON.parse(data);
              drawWheel(); createSettingsForm();
              alert(`${key}을(를) 불러왔습니다.`);
            } else {
              alert('없음');
            }
          } else if (action === '초기화') {
            options = Array.from({ length: 30 }, (_, i) => ({
              name: `${i + 1}`, probability: 999, color: `hsl(${(i * 12) % 360}, 80%, 60%)`
            }));
            localStorage.setItem(key, JSON.stringify(options));
            drawWheel(); createSettingsForm();
            alert(`${key}을(를) 기본 설정으로 되돌렸습니다.`);
          }
        };
        row.appendChild(btn);
      });
      slotsDiv.appendChild(row);
    }
  }

  createSlotControls();
  drawWheel();
