/* ----- clients ----- */

function ageFor(date){
  if (!date) return '—';
  const d = new Date(date+'T12:00:00'), now = new Date();
  let years = now.getFullYear()-d.getFullYear();
  if (now.getMonth()<d.getMonth() || (now.getMonth()===d.getMonth() && now.getDate()<d.getDate())) years--;
  return years>=0 && years<130 ? years : '—';
}
function coordinatorName(c){
  const p = D.profiles.find(p=>p.id===c.created_by);
  return p ? (p.id===me.id ? 'Coordinator 1 (you)' : pname(p)) : 'Not assigned';
}
function clientField(label,name,value,type,extra){
  return '<label>'+label+'<input name="'+name+'" type="'+(type||'text')+'" value="'+esc(value||'')+'" '+(extra||'')+'></label>';
}
function clientEditor(){
  const c = selectedClient==='new' ? null : D.clientRecords.find(x=>x.id===selectedClient);
  if (selectedClient!=='new' && !c) { selectedClient=null; return viewClients(); }
  return '<div class="bar"><h2>'+(c?'Client details: '+esc(c.full_name):'Add New Client')+'</h2><button class="ghost sm" data-act="client-back">Back to Clients</button></div>'+
  '<form id="client-form" class="client-form stack" data-client-id="'+esc(c?.id||'')+'">'+
  '<p class="hint">Coordinator-managed record. No login account or password is created.</p>'+
  '<div class="client-fields">'+
  clientField('Full name *','full_name',c?.full_name,'text','required maxlength="200" autocomplete="name"')+
  clientField('Date of birth','date_of_birth',c?.date_of_birth,'date','max="'+todayStr()+'"')+
  clientField('Email','email',c?.email,'email','maxlength="254" autocomplete="email"')+
  clientField('Phone','phone',c?.phone,'tel','maxlength="40" autocomplete="tel"')+
  clientField('Address','address',c?.address,'text','maxlength="500" autocomplete="street-address"')+
  clientField('Emergency contact name','emergency_contact_name',c?.emergency_contact_name,'text','maxlength="200"')+
  clientField('Emergency contact phone','emergency_contact_phone',c?.emergency_contact_phone,'tel','maxlength="40"')+
  '</div><label>Notes (optional)<textarea name="notes" class="client-notes" rows="4" maxlength="2000">'+esc(c?.notes||'')+'</textarea></label>'+
  '<p class="hint">Coordinator: '+esc(c?coordinatorName(c):'Coordinator 1 (you)')+'</p>'+
  '<div class="client-actions"><button type="submit" class="primary">'+(c?'Save changes':'Add Client')+'</button>'+
  (c?'<button type="button" class="ghost danger" data-act="delete-client" data-id="'+esc(c.id)+'">Delete client</button>':'')+
  '</div><div id="client-error" class="msg" role="alert"></div></form>';
}
function clientAvatar(c){
  const match=/^Client ([123])$/.exec(c.full_name||'');
  if (match && (c.notes||'').startsWith('Example client')) return '<img class="client-avatar" src="./assets/client-'+match[1]+'.svg" alt="Illustrated avatar for '+esc(c.full_name)+'" loading="lazy">';
  return '<span class="client-avatar client-initials" aria-hidden="true">'+esc((c.full_name||'?').trim().slice(0,1).toUpperCase())+'</span>';
}
function viewClients(){
  if (selectedClient) return clientEditor();
  const records=[...D.clientRecords].sort((a,b)=>a.full_name.localeCompare(b.full_name));
  const directory = records.length ?
    '<div class="scroll"><table><thead><tr><th>Client</th><th>Age</th><th>Contact</th><th>Coordinator</th><th></th></tr></thead><tbody>'+
      records.map(c=>'<tr><td><span class="client-identity">'+clientAvatar(c)+'<button class="link" data-act="open-client" data-id="'+esc(c.id)+'"><strong>'+esc(c.full_name)+'</strong></button></span></td><td>'+ageFor(c.date_of_birth)+'</td><td>'+esc(c.email||c.phone||'—')+'</td><td>'+esc(coordinatorName(c))+'</td><td class="act"><button class="ghost sm" data-act="open-client" data-id="'+esc(c.id)+'">View / Edit</button></td></tr>').join('')+
    '</tbody></table></div>' : '<div class="empty">No clients yet. Select Add Client to get started.</div>';
  const accountClients=byRole('client');
  const accounts = !accountClients.length ? '' :
    '<h3 class="sub">Clients with website logins</h3><p class="hint">These accounts are kept separate from the coordinator-managed client directory.</p><div class="scroll"><table><thead><tr><th>Name</th><th>Email</th><th></th></tr></thead><tbody>'+
    accountClients.map(c=>'<tr><td>'+esc(pname(c))+'</td><td>'+esc(c.email)+'</td><td class="act"><button class="ghost sm" data-act="add-appt" data-client="'+esc(c.id)+'">Add appointment</button></td></tr>').join('')+'</tbody></table></div>';
  return '<div class="bar"><h2>Clients</h2><button class="primary" data-act="new-client">Add Client</button></div>'+
  '<p class="hint">View, add, edit and delete client records.</p>'+directory+accounts;
}
async function saveClientRecord(form){
  if (!['admin','coordinator'].includes(me?.role)) return toast('Only coordinators and admins may manage clients.',true);
  const f=Object.fromEntries(new FormData(form));
  const fields=['full_name','date_of_birth','email','phone','address','emergency_contact_name','emergency_contact_phone','notes'];
  const values=Object.fromEntries(fields.map(k=>[k,(f[k]||'').trim()||null]));
  if (!values.full_name) return;
  if (values.date_of_birth && values.date_of_birth>todayStr()) return toast('Date of birth cannot be in the future.',true);
  const id=form.dataset.clientId;
  const query=id ? sb.from('client_records').update({...values,updated_at:new Date().toISOString()}).eq('id',id).select() :
    sb.from('client_records').insert({...values,created_by:me.id}).select();
  const {data,error}=await query;
  if (error||!data?.length) { form.querySelector('#client-error').textContent=error?.message||'Unable to save client.'; return; }
  selectedClient=id||data[0].id;
  await loadAll(); render(); toast(id?'Client updated.':'Client added.');
}
