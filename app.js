const form = document.getElementById('birthdayForm');
const nameInput = document.getElementById('name');
const birthdayInput = document.getElementById('birthday');
const birthTimeInput = document.getElementById('birthTime');
const countdownSection = document.getElementById('countdown');
const greetingEl = document.getElementById('greeting');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const millisecondsEl = document.getElementById('milliseconds');
const resetButton = document.getElementById('resetButton');

let frameId = null;

form.addEventListener('submit', (event) => {
    event.preventDefault();
    startCountdown(nameInput.value.trim(), birthdayInput.value, birthTimeInput.value);
});

resetButton.addEventListener('click', () => {
    cancelAnimationFrame(frameId);
    countdownSection.hidden = true;
    form.hidden = false;
});

function startCountdown(name, dateValue, timeValue) {
    // <input type="date"> gives "YYYY-MM-DD". We only care about month/day
    // (the birth year isn't needed to find the *next* occurrence), and we
    // pull them out by hand rather than `new Date(dateValue)` because that
    // string form is parsed as UTC midnight, which shifts to the previous
    // day in any timezone behind UTC.
    const [, month, day] = dateValue.split('-').map(Number);

    // Birth time is optional — default to midnight so the countdown still
    // works for people who don't know their exact birth time.
    const [hour, minute] = timeValue ? timeValue.split(':').map(Number) : [0, 0];

    form.hidden = true;
    countdownSection.hidden = false;

    cancelAnimationFrame(frameId);

    const loop = () => {
        tick(name, month, day, hour, minute);
        frameId = requestAnimationFrame(loop);
    };
    loop();
}

function tick(name, month, day, hour, minute) {
    const now = new Date();
    const target = getNextBirthday(now, month, day, hour, minute);
    const diff = target - now;

    // getNextBirthday only rolls forward to next year once today's birthday
    // has fully elapsed, so a non-positive diff here means "today is the day".
    if (diff <= 0) {
        greetingEl.textContent = `🎉 Happy Birthday, ${name}! 🎉`;
        [daysEl, hoursEl, minutesEl, secondsEl].forEach((el) => (el.textContent = '00'));
        millisecondsEl.textContent = '000';
        return;
    }

    // Compare calendar dates (not raw ms) so "tomorrow" and "within 5 days"
    // line up with what a person means by those words, regardless of the
    // exact birth time — e.g. 1 minute past midnight is still "tomorrow".
    const calendarDaysUntil = calendarDaysBetween(now, target);
    if (calendarDaysUntil === 1) {
        greetingEl.textContent = `${name}, it's your birthday tomorrow!`;
    } else if (calendarDaysUntil <= 5) {
        greetingEl.textContent = `${name}, your birthday is coming up!`;
    } else {
        greetingEl.textContent = '';
    }

    const totalMs = diff;
    const totalSeconds = Math.floor(totalMs / 1000);
    daysEl.textContent = pad(Math.floor(totalSeconds / 86400));
    hoursEl.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    minutesEl.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    secondsEl.textContent = pad(totalSeconds % 60);
    millisecondsEl.textContent = pad(totalMs % 1000, 3);
}

function getNextBirthday(now, month, day, hour, minute) {
    const year = now.getFullYear();
    const thisYearsBirthday = new Date(year, month - 1, day, hour, minute, 0, 0);
    const endOfBirthday = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Only skip to next year once the whole calendar day has passed, so the
    // countdown correctly switches to "Happy Birthday" (for the rest of that
    // day) instead of jumping straight to next year right after the exact
    // birth-time moment ticks over.
    if (now > endOfBirthday) {
        return new Date(year + 1, month - 1, day, hour, minute, 0, 0);
    }
    return thisYearsBirthday;
}

function calendarDaysBetween(from, to) {
    const fromMidnight = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const toMidnight = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((toMidnight - fromMidnight) / 86400000);
}

function pad(value, length = 2) {
    return String(value).padStart(length, '0');
}
