let editingId = null;
const byLine = (p) => `By ${p.author?.name || 'Unknown'} · ${new Date(p.createdAt).toLocaleDateString()}`;

async function openPosts(mode = 'all', author) {
  try {
    if (mode === 'mine') {
      if (!session) { show('account'); return toast('Please log in first'); }
      author = { _id: session.user.id, name: session.user.name };
    }
    const posts = await api(author ? `/api/users/${author._id}/posts` : '/api/posts');
    $('#heading').textContent = author ? `Posts by ${author.name}` : 'All Posts';
    $('#posts').replaceChildren(...posts.map((p) => el('article', { className: 'card' },
      el('h3', {}, p.title),
      el('p', { className: 'muted' }, byLine(p)),
      el('p', {}, p.content.length > 140 ? `${p.content.slice(0, 140)}...` : p.content),
      el('button', { onclick: () => openPost(p._id) }, 'Read more'), ' ',
      el('button', { className: 'alt', onclick: () => openPosts('user', p.author) }, `More by ${p.author.name}`))));
    if (!posts.length) $('#posts').append(el('p', {}, 'No posts yet.'));
    show('list');
  } catch (e) { toast(e.message); }
}

async function openPost(id) {
  try {
    const p = await api(`/api/posts/${id}`);
    $('#post').replaceChildren(
      el('h2', {}, p.title),
      el('p', { className: 'muted' }, byLine(p)),
      el('p', { className: 'pre' }, p.content));
    if (session?.user.id === p.author._id) {
      $('#post').append(
        el('button', { onclick: () => openEditor(p) }, 'Edit'), ' ',
        el('button', { className: 'danger', onclick: () => deletePost(p._id) }, 'Delete'));
    }
    show('detail');
  } catch (e) { toast(e.message); }
}

function openEditor(post) {
  if (!session) { show('account'); return toast('Please log in first'); }
  editingId = post?._id || null;
  $('#editorTitle').textContent = editingId ? 'Edit Post' : 'Create a New Post';
  $('#title').value = post?.title || '';
  $('#content').value = post?.content || '';
  show('editor');
}

async function savePost() {
  try {
    await api(editingId ? `/api/posts/${editingId}` : '/api/posts', editingId ? 'PUT' : 'POST',
      { title: $('#title').value, content: $('#content').value });
    toast('Post saved');
    openPosts();
  } catch (e) { toast(e.message); }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try { await api(`/api/posts/${id}`, 'DELETE'); openPosts(); } catch (e) { toast(e.message); }
}

function onSession() {
  $('#authBtn').textContent = session ? `Logout (${session.user.name})` : 'Login';
  $('#authBtn').onclick = () => (session ? setSession(null) : show('account'));
  openPosts();
}
onSession();
