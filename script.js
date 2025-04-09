const prayerMap = {
  fajr: { key: 'Fajr', label: 'الفجر', icon: 'fas fa-sun' },
  sunrise: { key: 'Sunrise', label: 'الشروق', icon: 'fas fa-sun' },
  dhuhr: { key: 'Dhuhr', label: 'الظهر', icon: 'fas fa-cloud-sun' },
  asr: { key: 'Asr', label: 'العصر', icon: 'fas fa-sun' },
  maghrib: { key: 'Maghrib', label: 'المغرب', icon: 'fas fa-sunset' },
  isha: { key: 'Isha', label: 'العشاء', icon: 'fas fa-moon' }
};

async function updateTimes() {
  const city = document.getElementById('city').value;
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Egypt&method=5`
    );
    const json = await res.json();
    const timings = json.data.timings;
    const timezone = json.data.meta.timezone;

    const nowStr = new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [nowH, nowM] = nowStr.split(':').map(Number);
    const nowMinutes = nowH * 60 + nowM;

    let nextId = 'fajr';
    let nextTime = 0;

    let nextPrayerTimeInMinutes = Infinity;

    for (const id of Object.keys(prayerMap)) {
      const [h, m] = timings[prayerMap[id].key].split(':').map(Number);
      const prayerTimeInMinutes = h * 60 + m;

      if (nowMinutes < prayerTimeInMinutes) {
        nextId = id;
        nextPrayerTimeInMinutes = prayerTimeInMinutes;
        break;
      }
    }

    if (nextPrayerTimeInMinutes === Infinity) {
      nextPrayerTimeInMinutes = 0; // اذا لم تجد وقت للصلاة القادمة، ارجع للصبح (الفجر)
    }

    Object.keys(prayerMap).forEach(id => {
      const info = prayerMap[id];
      const display = timings[info.key];
      const el = document.getElementById(id);

      const [h, m] = display.split(':').map(Number);
      const prayerTimeInMinutes = h * 60 + m;
      let timeRemaining = prayerTimeInMinutes - nowMinutes;

      // إذا كانت الصلاة قد مرّت، احسب الوقت المتبقي للصلاة القادمة
      if (timeRemaining < 0) {
        // أضف 24 ساعة لحساب الوقت المتبقي للصلاة في اليوم التالي
        timeRemaining += 1440; // 1440 دقيقة في اليوم (24 ساعة)
      }

      const hoursRemaining = Math.floor(timeRemaining / 60);
      const minutesRemaining = timeRemaining % 60;
      const remainingText = `${hoursRemaining} ساعة و ${minutesRemaining} دقيقة`;

      el.innerHTML = 
        `<i class="${info.icon} icon"></i>` +
        `<span>${info.label}</span>` +
        `<span>${display}</span>` +
        `<div class="time-remaining">${remainingText}</div>`; // إضافة الوقت المتبقي

      el.classList.toggle('active', id === nextId);
    });

  } catch (e) {
    console.error('Error fetching prayer times:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date').textContent = today.toLocaleDateString('ar-EG', options);

  document.getElementById('city').addEventListener('change', updateTimes);
  updateTimes();
});
