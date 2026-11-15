const $ = selector => document.querySelector(selector);
let contacts = [], favoritesOnly = false, editingId = null, deletingId = null;
const fields = ['phones', 'emails', 'socials', 'addresses'];
async function api(path, options = {}) {
  const response = await fetch('/api/' + path, {...options, headers: {'X-Requested-With': 'ContactBook', ...options.headers}});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '操作失败，请重试');
  return result;
}
function notice(message, error = false) {
  $('#notice').textContent = message;
  $('#notice').className = error ? 'error' : '';
}
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function render() {
  $('#all-count').textContent = contacts.length;
  $('#fav-count').textContent = contacts.filter(c => c.favorite).length;
  $('#view-title').textContent = favoritesOnly ? '收藏联系人' : '全部联系人';
  $('#all').classList.toggle('active', !favoritesOnly);
  $('#favorites').classList.toggle('active', favoritesOnly);
  const query = $('#search').value.trim().toLocaleLowerCase();
  const visible = contacts.filter(c => (!favoritesOnly || c.favorite) && [c.name, c.notes, ...fields.flatMap(k => c[k])].join(' ').toLocaleLowerCase().includes(query));
  $('#result-count').textContent = `${visible.length} 位联系人`;
  $('#list').replaceChildren();
  if (!visible.length) {
    const empty = el('div', undefined, 'empty');
    empty.append(el('h2', query ? '没有找到匹配的联系人' : '暂无联系人'), el('p', '点击“新建联系人”或导入 Excel。'));
    $('#list').append(empty);
  }
  for (const contact of visible) {
    const card = el('article', undefined, 'card');
    const top = el('div', undefined, 'card-top');
    const name = el('div');
    name.append(el('h2', contact.name));
    const star = el('button', contact.favorite ? '★' : '☆', 'star' + (contact.favorite ? ' on' : ''));
    star.setAttribute('aria-label', `${contact.favorite ? '取消收藏' : '收藏'}${contact.name}`);
    star.setAttribute('aria-pressed', String(contact.favorite));
    star.onclick = async () => {
      star.disabled = true;
      try { await api('contacts/' + contact.id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...contact, favorite:!contact.favorite})}); await load(); }
      catch (error) { notice(error.message, true); star.disabled = false; }
    };
    top.append(el('div', [...contact.name][0], 'avatar'), name, star);
    card.append(top);
    for (const [key, title] of [['phones','电话'],['emails','邮箱'],['socials','社交'],['addresses','地址']]) {
      if (!contact[key].length) continue;
      const detail = el('div', undefined, 'detail');
      detail.append(el('span', title), el('span', contact[key].join('\n')));
      card.append(detail);
    }
    if (contact.notes) { const note = el('div', undefined, 'detail'); note.append(el('span','备注'),el('span',contact.notes)); card.append(note); }
    const actions = el('div', undefined, 'card-actions');
    const edit = el('button', '编辑联系人');
    edit.onclick = () => openEditor(contact);
    const remove = el('button', '删除');
    remove.setAttribute('aria-label', '删除' + contact.name);
    remove.onclick = () => { deletingId = contact.id; $('#delete-dialog').showModal(); };
    actions.append(edit, remove); card.append(actions); $('#list').append(card);
  }
}
async function load() { contacts = await api('contacts'); render(); }
function openEditor(contact = null) {
  editingId = contact?.id || null;
  $('#form').reset(); $('#form-error').textContent = '';
  $('#editor-title').textContent = contact ? '编辑联系人' : '新建联系人';
  if (contact) {
    for (const key of ['name','notes']) $('#form').elements[key].value = contact[key];
    for (const key of fields) $('#form').elements[key].value = contact[key].join('\n');
    $('#form').elements.favorite.checked = contact.favorite;
  }
  $('#editor').showModal();
}
$('#new').onclick = () => openEditor();
$('#close').onclick = $('#cancel').onclick = () => $('#editor').close();
$('#all').onclick = () => { favoritesOnly = false; render(); };
$('#favorites').onclick = () => { favoritesOnly = true; render(); };
$('#search').oninput = render;
$('#form').onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget;
  const data = {name:form.elements.name.value, notes:form.elements.notes.value, favorite:form.elements.favorite.checked};
  for (const key of fields) data[key] = form.elements[key].value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  $('#save').disabled = true;
  try {
    await api('contacts' + (editingId ? '/' + editingId : ''), {method:editingId ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    $('#editor').close(); await load(); notice('联系人已保存');
  } catch (error) { $('#form-error').textContent = error.message; }
  finally { $('#save').disabled = false; }
};
$('#keep').onclick = () => $('#delete-dialog').close();
$('#confirm-delete').onclick = async () => {
  $('#confirm-delete').disabled = true;
  try { await api('contacts/' + deletingId, {method:'DELETE'}); $('#delete-dialog').close(); await load(); notice('联系人已删除'); }
  catch (error) { notice(error.message, true); }
  finally { $('#confirm-delete').disabled = false; }
};
$('#import').onclick = () => $('#file').click();
$('#file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 3 * 1024 * 1024) { notice('请选择不超过3 MB的 .xlsx 文件', true); event.target.value = ''; return; }
  $('#import').disabled = true;
  try { const contactsToImport = ContactExcel.read(await file.arrayBuffer()); const result = await api('import', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(contactsToImport)}); await load(); notice(`导入完成：新增 ${result.added} 位，跳过 ${result.skipped} 条完全相同的记录`); }
  catch (error) { notice(error.message, true); }
  finally { event.target.value = ''; $('#import').disabled = false; }
};
load().catch(error => notice('无法连接服务：' + error.message, true));

for (const [selector,template] of [['a[href="/api/export"]',false],['a[href="/api/template"]',true]]) {
  $(selector).onclick = async event => {
    event.preventDefault();
    try {
      const data = template ? [] : await api('contacts');
      const blob = new Blob([ContactExcel.write(data)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = template ? 'contacts-template.xlsx' : 'contacts.xlsx'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notice(template ? '模板已下载，所有列请使用文本格式' : 'Excel 已导出');
    } catch (error) { notice(error.message,true); }
  };
}
