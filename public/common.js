const $ = (s) => document.querySelector(s);

// Build elements with textContent so user input is never run as HTML
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

let session = JSON.parse(localStorage.getItem('session') || 'null');

async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session && { Authorization: `Bearer ${session.token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && session) setSession(null);
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function toast(text) {
  $('#msg').textContent = text;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { $('#msg').textContent = ''; }, 2500);
}

function setSession(value) {
  session = value;
  if (value) localStorage.setItem('session', JSON.stringify(value));
  else localStorage.removeItem('session');
  onSession();
}

function show(view) {
  document.querySelectorAll('section').forEach((s) => s.classList.toggle('hidden', s.id !== view));
}

async function authenticate(kind) {
  try {
    setSession(await api(`/api/auth/${kind}`, 'POST', {
      name: $('#name').value, email: $('#email').value, password: $('#password').value,
    }));
    toast(`Welcome, ${session.user.name}`);
  } catch (e) { toast(e.message); }
}
