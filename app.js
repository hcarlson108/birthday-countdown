const form = document.getElementById('birthdayForm');
const nameInput = document.getElementById('name');
const birthdayInput = document.getElementById('birthday');
const birthTimeInput = document.getElementById('birthTime');
const countdownSection = document.getElementById('countdown');
const greetingEl = document.getElementById('greeting');
const ageInfoEl = document.getElementById('ageInfo');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const millisecondsEl = document.getElementById('milliseconds');
const monthsWeeksEl = document.getElementById('monthsWeeks');
const resetButton = document.getElementById('resetButton');
const pageTitleEl = document.getElementById('pageTitle');

const DEFAULT_TITLE = pageTitleEl.textContent;
let frameId = null;

form.addEventListener('submit', (event) => {
    event.preventDefault();
    startCountdown(nameInput.value.trim(), birthdayInput.value, birthTimeInput.value);
});

resetButton.addEventListener('click', () => {
    cancelAnimationFrame(frameId);
    countdownSection.hidden = true;
    form.hidden = false;
    pageTitleEl.textContent = DEFAULT_TITLE;
});

function startCountdown(name, dateValue, timeValue) {
    // <input type="date"> gives "YYYY-MM-DD". We parse it by hand rather than
    // `new Date(dateValue)` because that string form is parsed as UTC
    // midnight, which shifts to the previous day in any timezone behind UTC.
    const [birthYear, month, day] = dateValue.split('-').map(Number);

    // Birth time is optional — default to midnight so the countdown still
    // works for people who don't know their exact birth time.
    const [hour, minute] = timeValue ? timeValue.split(':').map(Number) : [0, 0];

    form.hidden = true;
    countdownSection.hidden = false;
    pageTitleEl.textContent = name;

    cancelAnimationFrame(frameId);

    const loop = () => {
        tick(name, birthYear, month, day, hour, minute);
        frameId = requestAnimationFrame(loop);
    };
    loop();
}

function tick(name, birthYear, month, day, hour, minute) {
    const now = new Date();
    const target = getNextBirthday(now, month, day, hour, minute);
    const diff = target - now;

    // The age they turn on `target` is just the gap between its year and
    // their birth year, however many years out `target` has rolled to.
    const turningAge = target.getFullYear() - birthYear;

    // getNextBirthday only rolls forward to next year once today's birthday
    // has fully elapsed, so a non-positive diff here means "today is the day".
    if (diff <= 0) {
        greetingEl.textContent = `HAPPY BIRTHDAY ${name}! 🎉`;
        ageInfoEl.textContent = `You are now ${turningAge} years old!`;
        [daysEl, hoursEl, minutesEl, secondsEl].forEach((el) => (el.textContent = '00'));
        millisecondsEl.textContent = '000';
        monthsWeeksEl.textContent = '';
        return;
    }

    ageInfoEl.textContent = `You are currently ${turningAge - 1}, turning ${turningAge}!`;

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

    monthsWeeksEl.textContent = describeInMonthsAndWeeks(now, target);
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

function describeInMonthsAndWeeks(now, target) {
    // Count whole calendar months first (so "months" tracks actual month
    // boundaries, not a fixed 30-day guess), then break the leftover time
    // into weeks. This is what lets months + weeks add back up exactly to
    // the same span the D/H/M/S clock above is counting down.
    let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    let monthMark = addMonths(now, months);
    if (monthMark > target) {
        months -= 1;
        monthMark = addMonths(now, months);
    }

    const leftoverDays = Math.floor((target - monthMark) / 86400000);
    const weeks = Math.floor(leftoverDays / 7);

    if (months <= 0 && weeks <= 0) {
        return '';
    }

    const parts = [];
    if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    if (weeks > 0) parts.push(`${weeks} week${weeks === 1 ? '' : 's'}`);
    return `That's ${parts.join(' and ')} away!`;
}

function addMonths(date, months) {
    return new Date(
        date.getFullYear(),
        date.getMonth() + months,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    );
}

function pad(value, length = 2) {
    return String(value).padStart(length, '0');
}
