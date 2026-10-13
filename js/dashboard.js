/* Brisbane & Queensland: verified 2026/27 public holidays and dated local events.
   Events are editorial entries, not a live feed. See each source for changes. */
const QLD_HOLIDAY_SOURCE = 'https://www.qld.gov.au/recreation/travel/holidays/public';
const BRISBANE_EVENTS_SOURCE = 'https://www.brisbane.qld.gov.au/events-arts-and-culture/what-s-on-in-brisbane/event-search';
const VISIT_BRISBANE_SOURCE = 'https://visit.brisbane.qld.au/en/whats-on/whats-on-this-week';
const QLD_SCHOOL_SOURCE = 'https://education.qld.gov.au/about/Pages/termDates.aspx';
const qldHolidays = {
  2026: [
    ['01-01',"New Year's Day"],['01-26','Australia Day'],['04-03','Good Friday'],
    ['04-04','Day after Good Friday'],['04-05','Easter Sunday'],['04-06','Easter Monday'],
    ['04-25','Anzac Day'],['05-04','Labour Day'],['08-12','Ekka show holiday (Brisbane only)'],
    ['10-05',"King's Birthday"],['12-24','Christmas Eve (from 6 pm)'],
    ['12-25','Christmas Day'],['12-26','Boxing Day'],['12-28','Additional Boxing Day holiday']
  ],
  2027: [
    ['01-01',"New Year's Day"],['01-26','Australia Day'],['03-26','Good Friday'],
    ['03-27','Day after Good Friday'],['03-28','Easter Sunday'],['03-29','Easter Monday'],
    ['04-26','Anzac Day holiday'],['05-03','Labour Day'],['08-11','Ekka show holiday (Brisbane only)'],
    ['10-04',"King's Birthday"],['12-24','Christmas Eve (from 6 pm)'],
    ['12-25','Christmas Day'],['12-27','Additional Christmas Day holiday'],
    ['12-26','Boxing Day'],['12-28','Additional Boxing Day holiday']
  ]
};
const brisbaneSpecialEvents = [
  {date:'2026-10-03',title:'Valley Fiesta',category:'Brisbane event',
    detail:'Free live music and street festival in Fortitude Valley.',
    url:'https://www.brisbane.qld.gov.au/events-arts-and-culture/what-s-on-in-brisbane/valley-fiesta'},
  {date:'2026-10-06',title:'Queensland state schools — Term 4 begins',category:'School calendar',
    detail:'State school students return after the September holidays.',
    url:QLD_SCHOOL_SOURCE},
  {date:'2026-10-13',title:'Zara Larsson — Riverstage',category:'Brisbane event',
    detail:'Concert at Riverstage; see Brisbane City Council for details.',
    url:'https://www.brisbane.qld.gov.au/'},
  {date:'2026-10-21',title:'Melt Festival begins',category:'Brisbane festival',
    detail:'Arts and cultural festival running from 21 October to 8 November.',
    url:VISIT_BRISBANE_SOURCE},
  {date:'2026-10-24',title:'River Pride Parade',category:'Brisbane event',
    detail:'Brisbane River parade, part of Melt Festival.',
    url:VISIT_BRISBANE_SOURCE},
  {date:'2026-11-08',title:'Melt Festival concludes',category:'Brisbane festival',
    detail:'Final day of the 2026 citywide arts festival.',
    url:VISIT_BRISBANE_SOURCE},
  {date:'2026-11-15',title:'The Lion King opens in Brisbane',category:'Brisbane event',
    detail:'Musical season scheduled through March 2027.',
    url:VISIT_BRISBANE_SOURCE}
];
function brisbaneToday(){
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=k=>parts.find(p=>p.type===k)?.value;
  return {year:Number(get('year')),month:Number(get('month')),day:Number(get('day'))};
}
function brisbaneEventsFor(year,month){
  const prefix=year+'-'+String(month).padStart(2,'0')+'-';
  const holidays=(qldHolidays[year]||[]).map(([day,title])=>({
    date:year+'-'+day,title,category:'Public holiday',detail:title.includes('Ekka')?'Brisbane area only':'Queensland public holiday',
    url:QLD_HOLIDAY_SOURCE
  }));
  return [...holidays,...brisbaneSpecialEvents].filter(e=>e.date.startsWith(prefix))
    .sort((a,b)=>a.date.localeCompare(b.date));
}
function dashboardCalendarDays(year,month,events,today){
  const starts=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const notable=new Set(events.map(e=>Number(e.date.slice(-2))));
  let out='<div class="dash-month-grid" aria-label="Month overview">';
  for(const d of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])out+='<span class="dash-weekday">'+d+'</span>';
  for(let n=0;n<starts;n++)out+='<span aria-hidden="true"></span>';
  for(let n=1;n<=days;n++){
    const active=notable.has(n),isToday=year===today.year&&month===today.month&&n===today.day;
    out+='<span class="dash-day'+(active?' dash-has-event':'')+(isToday?' dash-today':'')+'"'+(isToday?' aria-current="date"':'')+'>'+n+(active?'<i aria-hidden="true"></i>':'')+'</span>';
  }
  return out+'</div>';
}
function viewDashboard(){
  const now=brisbaneToday(),{year,month}=now;
  const monthName=new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'Australia/Brisbane'}).format(new Date(Date.UTC(year,month-1,1,12)));
  const events=brisbaneEventsFor(year,month);
  const visible=events.slice(0,5);
  const cards=visible.length?visible.map(e=>{
    const day=Number(e.date.slice(-2));
    const dow=new Intl.DateTimeFormat('en-AU',{weekday:'short',timeZone:'UTC'}).format(new Date(e.date+'T12:00:00Z'));
    const past=day<now.day;
    return '<li class="dash-event'+(past?' dash-past':'')+'"><div class="dash-date"><strong>'+day+'</strong><small>'+dow+'</small></div><div class="dash-event-text"><span class="dash-category">'+esc(e.category)+'</span><strong>'+esc(e.title)+'</strong><p>'+esc(e.detail)+'</p><a href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">More information ↗</a></div></li>';
  }).join(''):'<li class="dash-no-events">No verified events have been added for this month yet. Check the official local listings below.</li>';
  const note=year>=2026&&year<=2027?
    'Dates are selected and verified, not a live event feed. Always check the organiser for changes.':
    'Public holiday dates for this year have not yet been verified here. Check the Queensland Government for official dates.';
  return '<div class="bar"><h2>Dashboard</h2></div>'+
    '<section class="dash-section" aria-labelledby="brisbane-cal-title">'+
    '<div class="dash-heading"><div><h3 id="brisbane-cal-title">Brisbane &amp; Queensland — what’s on</h3><p class="hint">Local events, celebrations and public holidays for '+esc(monthName)+'</p></div><span class="dash-location">Brisbane, QLD</span></div>'+
    '<div class="dash-calendar-layout"><div><h4>'+esc(monthName)+'</h4>'+dashboardCalendarDays(year,month,events,now)+'</div>'+
    '<div><h4>Dates to know</h4><ol class="dash-event-list">'+cards+'</ol></div></div>'+
    '<p class="dash-source-note">'+note+'</p>'+
    '<div class="dash-source-links"><a href="'+QLD_HOLIDAY_SOURCE+'" target="_blank" rel="noopener noreferrer">QLD public holidays ↗</a><a href="'+BRISBANE_EVENTS_SOURCE+'" target="_blank" rel="noopener noreferrer">Brisbane events ↗</a></div></section>';
}
