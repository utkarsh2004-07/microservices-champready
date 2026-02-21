const API = 'http://localhost:8080';
let token = localStorage.getItem('token') || '';

const $ = (id) => document.getElementById(id);
const setText = (id, text) => ($(id).textContent = text);

async function req(path, method = 'GET', body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

$('registerBtn').onclick = async () => {
  try {
    const data = await req('/auth/register', 'POST', {
      name: $('name').value,
      email: $('email').value,
      password: $('password').value,
      role: $('role').value
    });
    setText('authMsg', `Registered: ${data.email}`);
  } catch (e) { setText('authMsg', e.message); }
};

$('loginBtn').onclick = async () => {
  try {
    const data = await req('/auth/login', 'POST', { email: $('email').value, password: $('password').value });
    token = data.token;
    localStorage.setItem('token', token);
    setText('authMsg', 'Login success');
  } catch (e) { setText('authMsg', e.message); }
};

$('saveProfileBtn').onclick = async () => {
  try {
    const data = await req('/users/profile', 'PUT', {
      age: Number($('age').value),
      stream: $('stream').value,
      qualification: $('qualification').value
    });
    setText('eligibilityOut', JSON.stringify(data, null, 2));
  } catch (e) { setText('eligibilityOut', e.message); }
};

$('checkEligibilityBtn').onclick = async () => {
  try {
    const data = await req('/users/eligibility/check', 'POST');
    setText('eligibilityOut', JSON.stringify(data, null, 2));
  } catch (e) { setText('eligibilityOut', e.message); }
};

$('setExamBtn').onclick = async () => {
  try {
    const data = await req('/users/update-exam', 'PUT', { exam: $('examSelect').value });
    setText('eligibilityOut', JSON.stringify(data, null, 2));
  } catch (e) { setText('eligibilityOut', e.message); }
};

$('createMockBtn').onclick = async () => {
  try {
    const data = await req('/admin/mock-tests', 'POST', {
      title: $('mockTitle').value,
      examType: $('mockExam').value,
      duration: Number($('mockDuration').value),
      totalMarks: Number($('mockMarks').value),
      questions: JSON.parse($('questions').value || '[]')
    });
    setText('adminOut', `Created ${data._id}`);
  } catch (e) { setText('adminOut', e.message); }
};

$('publishMockBtn').onclick = async () => {
  try {
    const data = await req(`/admin/mock-tests/${$('publishId').value}/publish`, 'POST');
    setText('adminOut', JSON.stringify(data, null, 2));
  } catch (e) { setText('adminOut', e.message); }
};

$('loadMocksBtn').onclick = async () => {
  try { setText('studentOut', JSON.stringify(await req('/mock-tests'), null, 2)); }
  catch (e) { setText('studentOut', e.message); }
};
$('loadResultsBtn').onclick = async () => {
  try { setText('studentOut', JSON.stringify(await req('/results/me'), null, 2)); }
  catch (e) { setText('studentOut', e.message); }
};
$('loadProgressBtn').onclick = async () => {
  try { setText('studentOut', JSON.stringify(await req('/results/progress/overview'), null, 2)); }
  catch (e) { setText('studentOut', e.message); }
};
$('loadContentBtn').onclick = async () => {
  try { setText('contentOut', JSON.stringify(await req(`/content?kind=${$('kind').value}`), null, 2)); }
  catch (e) { setText('contentOut', e.message); }
};
