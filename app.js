(() => {
  const STORAGE_KEY = 'academic-sync-events-v1';
  const initialEvents = [
    {id:'evt-1', title:'자료구조 퀴즈 3 — 트리 순회', course:'자료구조', courseCode:'CS204', type:'quiz', date:'2026-11-25', time:'18:00', endTime:'18:30', place:'공학관 302호', source:'3주차 강의 공지', checked:false, confidence:99},
    {id:'evt-2', title:'운영체제 실습 과제 2', course:'운영체제', courseCode:'CS301', type:'assignment', date:'2026-11-27', time:'23:59', endTime:'23:59', place:'LMS 업로드', source:'실습과제 2 안내', checked:false, confidence:99},
    {id:'evt-3', title:'선형대수학 쪽지시험', course:'선형대수학', courseCode:'MTH202', type:'exam', date:'2026-11-28', time:'10:30', endTime:'11:30', place:'자연과학관 204호', source:'수업 중 공지', checked:false, confidence:96},
    {id:'evt-4', title:'마케팅 팀 프로젝트 기획안', course:'마케팅원론', courseCode:'BUS110', type:'project', date:'2026-11-29', time:'18:00', endTime:'18:00', place:'팀별 LMS 제출', source:'팀 프로젝트 안내', checked:false, confidence:97},
    {id:'evt-5', title:'운영체제 중간고사', course:'운영체제', courseCode:'CS301', type:'exam', date:'2026-12-02', time:'13:00', endTime:'15:00', place:'공학관 401호', source:'시험 일정 공지', checked:false, confidence:98},
    {id:'evt-6', title:'자료구조 과제 4 — 그래프 탐색', course:'자료구조', courseCode:'CS204', type:'assignment', date:'2026-12-04', time:'23:59', endTime:'23:59', place:'LMS 업로드', source:'과제 공지', checked:false, confidence:99},
    {id:'evt-7', title:'마케팅원론 팀 발표 자료', course:'마케팅원론', courseCode:'BUS110', type:'project', date:'2026-12-07', time:'12:00', endTime:'12:00', place:'강의실 발표', source:'팀 프로젝트 안내', checked:false, confidence:94},
    {id:'evt-8', title:'선형대수학 과제 5', course:'선형대수학', courseCode:'MTH202', type:'assignment', date:'2026-12-09', time:'23:59', endTime:'23:59', place:'e-Class 제출', source:'과제 공지', checked:false, confidence:98}
  ];
  let events = loadEvents();
  let activeCourse = '';
  let activeMonth = new Date(2026, 10, 1);
  let selectedDate = '2026-11-25';
  let showAllEvents = false;
  let currentExtracted = [];
  let modalStep = '';

  function loadEvents(){ try { const saved=localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : initialEvents.map(e=>({...e})); } catch { return initialEvents.map(e=>({...e})); } }
  function persist(){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(events)); } catch {} }
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const pad = n => String(n).padStart(2,'0');
  const iso = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const fmtMonth = date => `${date.getFullYear()}년 ${date.getMonth()+1}월`;
  const weekdays = ['일','월','화','수','목','금','토'];
  const typeLabel = {assignment:'과제',exam:'시험',quiz:'퀴즈',project:'팀플'};
  const dateObj = value => {const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d);};
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderAgenda(){
    const list=$('#agendaList');
    let filtered=events.filter(e=>!activeCourse||e.course===activeCourse).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    if(!showAllEvents) filtered=filtered.filter(e=>e.date>='2026-11-25').slice(0,5);
    if(!filtered.length){list.innerHTML='<div class="empty-state">선택한 과목의 일정이 아직 없어요.</div>';return;}
    const groups=new Map();
    filtered.forEach(e=>{if(!groups.has(e.date))groups.set(e.date,[]);groups.get(e.date).push(e);});
    list.innerHTML=[...groups.entries()].map(([date,items])=>{
      const d=dateObj(date), isToday=date==='2026-11-25';
      return `<section class="agenda-day"><div class="day-head"><span class="day-number">${d.getMonth()+1}월 ${d.getDate()}일</span><span class="day-name">${weekdays[d.getDay()]}요일</span>${isToday?'<span class="day-today">오늘</span>':''}<span class="day-count">${items.length}개 일정</span></div>${items.map(e=>`<article class="event-row ${e.completed?'completed':''}" data-id="${safe(e.id)}"><input class="event-check" type="checkbox" aria-label="${safe(e.title)} 선택" ${e.checked?'checked':''}><span class="event-edge ${safe(e.type)}"></span><div class="event-main"><div class="event-title-line"><span class="event-title" title="클릭하여 일정 수정">${safe(e.title)}</span><span class="event-tag ${safe(e.type)}">${typeLabel[e.type]||'일정'}</span></div><div class="event-meta"><span class="course-name">${safe(e.course)}</span><i class="meta-dot"></i><span>${safe(e.place||'시간 미정')}</span></div></div><div class="event-time"><strong>${safe(e.time||'시간 미정')}</strong><small>${safe(e.source||'공지에서 추출')}</small></div></article>`).join('')}</section>`;
    }).join('');
    $$('.event-row',list).forEach(row=>{
      const id=row.dataset.id;
      $('.event-check',row).addEventListener('change',ev=>{const item=events.find(e=>e.id===id);if(item){item.checked=ev.target.checked;persist();}});
      $('.event-title',row).addEventListener('click',()=>openEdit(id));
    });
  }

  function renderCalendar(){
    $('#monthTitle').textContent=fmtMonth(activeMonth);
    const year=activeMonth.getFullYear(),month=activeMonth.getMonth();
    const first=new Date(year,month,1), start=new Date(year,month,1-first.getDay());
    const html=['일','월','화','수','목','금','토'].map(w=>`<div class="weekday">${w}</div>`);
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);const key=iso(d), inMonth=d.getMonth()===month;
      const dayEvents=events.filter(e=>e.date===key);
      const cls=['calendar-day',!inMonth?'muted':'',key==='2026-11-25'?'today':'',selectedDate===key&&key!=='2026-11-25'?'selected':'',dayEvents.length?'has-event':'',dayEvents.some(e=>e.type==='exam')?'exam-day':''].filter(Boolean).join(' ');
      html.push(`<button class="${cls}" data-date="${key}" aria-label="${d.getMonth()+1}월 ${d.getDate()}일${dayEvents.length?`, 일정 ${dayEvents.length}건`:''}">${d.getDate()}</button>`);
    }
    $('#calendarGrid').innerHTML=html.join('');
    $$('.calendar-day','#calendarGrid').forEach(button=>button.addEventListener('click',()=>{selectedDate=button.dataset.date;activeMonth=new Date(dateObj(selectedDate).getFullYear(),dateObj(selectedDate).getMonth(),1);renderCalendar();showDay(selectedDate);}));
  }
  function showDay(date){const found=events.filter(e=>e.date===date);if(!found.length){toast(`${Number(date.slice(5,7))}월 ${Number(date.slice(8))}일에는 등록된 일정이 없어요.`);return;}showAllEvents=true;activeCourse='';$$('.course-item').forEach(b=>b.classList.remove('selected'));renderAgenda();toast(`${Number(date.slice(5,7))}월 ${Number(date.slice(8))}일 일정 ${found.length}건을 표시했어요.`);}
  function refreshCounts(){const count=events.filter(e=>e.date>='2026-11-23'&&e.date<='2026-11-29').length;$('#weekCount').textContent=count;const nearest=events.filter(e=>e.date>='2026-11-25').sort((a,b)=>a.date.localeCompare(b.date))[0];if(nearest){$('#nearestTitle').textContent=nearest.title;const days=Math.round((dateObj(nearest.date)-dateObj('2026-11-25'))/86400000);const badge=$('.deadline-badge');if(badge)badge.innerHTML=`<i></i> D-${days}`;$('.deadline-date').innerHTML=`<svg viewBox="0 0 20 20"><rect x="3" y="4.5" width="14" height="13" rx="2.5"/><path d="M6.5 2.5v4m7-4v4M3 8.5h14"/></svg>${Number(nearest.date.slice(5,7))}월 ${Number(nearest.date.slice(8))}일 (${weekdays[dateObj(nearest.date).getDay()]}) · ${nearest.time}`;}}
  function rerender(){renderAgenda();renderCalendar();refreshCounts();persist();}
  function toast(message,kind=''){const item=document.createElement('div');item.className=`toast ${kind}`;item.textContent=message;$('#toastRegion').appendChild(item);setTimeout(()=>item.remove(),3200);}
  function modal(content,step=''){modalStep=step;$('#modalContent').innerHTML=content;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';$('#modalClose').focus();}
  function closeModal(){ $('#modalBackdrop').hidden=true;document.body.style.overflow='';modalStep=''; }
  function openImport(){
    const sample='[운영체제] 실습과제 2 안내\n주제: 세마포어를 이용한 생산자-소비자 문제 구현\n제출: 12월 2일 23:59, LMS 업로드\n\n[자료구조] 퀴즈 일정 안내\n퀴즈 4: 12월 5일 오전 10시, 공학관 302호';
    modal(`<div class="modal-kicker">NOTICE EXTRACTOR</div><h2 id="modalTitle">공지에서 일정을 가져와요</h2><p class="modal-lead">강의 공지 텍스트를 붙여넣으면 일정과 마감일을 찾아 목록으로 정리해요.</p><label class="input-label" for="noticeText">공지 텍스트 <small>최대 5,000자</small></label><div class="textarea-wrap"><textarea class="notice-textarea" id="noticeText" maxlength="5000" placeholder="공지사항을 여기에 붙여넣으세요.\n\n예: 과제 제출은 12월 2일 23:59까지입니다."></textarea><span class="char-count" id="charCount">0 / 5,000</span></div><div class="example-notice">어떤 공지든 날짜·시간이 포함되어 있으면 일정으로 추출할 수 있어요.<button id="useExample">예시 입력</button></div><div class="modal-actions"><button class="button button-secondary" id="cancelImport">취소</button><button class="button button-primary" id="parseNotice"><svg viewBox="0 0 20 20"><path d="M10 2.5v3m0 9v3m7.5-7.5h-3m-9 0h-3m10.8-5.3-2.1 2.1m-6.4 6.4-2.1 2.1m10.6 0-2.1-2.1m-6.4-6.4L4.7 4.7"/></svg>일정 추출하기</button></div>`, 'import');
    $('#cancelImport').onclick=closeModal;$('#useExample').onclick=()=>{$('#noticeText').value=sample;$('#noticeText').dispatchEvent(new Event('input'));};$('#noticeText').addEventListener('input',()=>$('#charCount').textContent=`${$('#noticeText').value.length.toLocaleString()} / 5,000`);$('#parseNotice').onclick=()=>parseNotice($('#noticeText').value);
    $('#noticeText').focus();
  }
  function parseNotice(text){
    const raw=text.trim();if(!raw){$('#noticeText').focus();return;}
    const found=[];const dateRx=/(20\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*(?:일)?|(?<!\d)(\d{1,2})\s*월\s*(\d{1,2})\s*일|(?<![\d/])(\d{1,2})\/(\d{1,2})(?!\d)/g;
    let match;while((match=dateRx.exec(raw))!==null){let y,m,d;if(match[1]){y=Number(match[1]);m=Number(match[2]);d=Number(match[3]);}else if(match[4]){y=2026;m=Number(match[4]);d=Number(match[5]);}else{y=2026;m=Number(match[6]);d=Number(match[7]);}if(m<1||m>12||d<1||d>31)continue;
      const start=Math.max(raw.lastIndexOf('\n',match.index)+1,raw.lastIndexOf('\n\n',match.index)+2);const endCandidates=[raw.indexOf('\n',dateRx.lastIndex),raw.indexOf('\n\n',dateRx.lastIndex)].filter(i=>i>=0);const end=endCandidates.length?Math.min(...endCandidates):raw.length;const block=raw.slice(start,end).trim();
      let header=(block.split('\n').find(line=>line.trim()&&!/^(제출|마감|일시|날짜|기간|시험|발표|퀴즈)\s*[:：]/.test(line.trim()))||block).trim();
      header=header.replace(/^\[[^\]]+\]\s*/, '').replace(/^(?:\d+[.)]\s*)/,'').slice(0,50);
      const courseMatch=block.match(/\[([^\]]+)\]/);const course=courseMatch?.[1]||inferCourse(block)||'수업';
      let type='assignment';if(/중간고사|기말고사|시험|쪽지시험/.test(block))type='exam';else if(/퀴즈|퀴즈/.test(block))type='quiz';else if(/팀s*프로젝트|발표|프로젝트/.test(block))type='project';
      const timeMatch=block.match(/(오전|오후)?\s*(\d{1,2})\s*[:시]\s*(\d{2})?\s*(?:분)?/);let time='23:59';if(timeMatch){let hour=Number(timeMatch[2]),min=Number(timeMatch[3]||0);if(timeMatch[1]==='오후'&&hour<12)hour+=12;if(timeMatch[1]==='오전'&&hour===12)hour=0;time=`${pad(hour)}:${pad(min)}`;}else if(/오전\s*\d{1,2}시/.test(block)){const hm=block.match(/오전\s*(\d{1,2})시/);time=`${pad(Number(hm[1]))}:00`;}else if(/오후\s*\d{1,2}시/.test(block)){const hm=block.match(/오후\s*(\d{1,2})시/);time=`${pad(Number(hm[1])+12)}:00`;}
      const loc=block.match(/(?:장소|강의실|공학관|자연과학관)[^,\n]*/);const place=loc?loc[0].replace(/^장소\s*[:：]?\s*/, '').trim():'공지에서 추출';
      found.push({id:`new-${Date.now()}-${found.length}`,title:header||`${course} 일정`,course,courseCode:courseCode(course),type,date:`${y}-${pad(m)}-${pad(d)}`,time,endTime:time,place,source:'붙여넣은 공지',checked:true,confidence:Math.floor(94+Math.random()*6)});
    }
    if(!found.length){const error=document.createElement('div');error.className='modal-error';error.textContent='일정을 추출할 수 있는 날짜를 찾지 못했어요. “12월 2일” 또는 “2026-12-02”처럼 입력해 주세요.';$('#modalContent').appendChild(error);return;}
    currentExtracted=found;renderExtracted();
  }
  function inferCourse(text){return ['자료구조','운영체제','선형대수학','마케팅원론','통계학','경제학','대학글쓰기'].find(c=>text.includes(c))||'';}
  function courseCode(course){return ({자료구조:'CS204',운영체제:'CS301',선형대수학:'MTH202',마케팅원론:'BUS110',통계학:'STA201',경제학:'ECO101'}[course]||'COURSE');}
  function renderExtracted(){
    const cards=currentExtracted.map((e,i)=>`<label class="extracted-item"><input type="checkbox" class="extract-check" data-index="${i}" ${e.checked?'checked':''}><div class="extracted-fields"><div class="edit-grid"><input class="form-input small-input extract-title" data-index="${i}" maxlength="50" value="${safe(e.title)}" aria-label="일정명"><input class="form-input small-input extract-date" data-index="${i}" type="datetime-local" value="${safe(e.date+'T'+e.time)}" aria-label="날짜와 시간"></div><div class="extract-meta"><span class="event-tag ${safe(e.type)}">${typeLabel[e.type]}</span> · ${safe(e.course)} · 출처 ${safe(e.source)} · <span class="confidence">${e.confidence}% 일치</span></div></div></label>`).join('');
    modal(`<div class="modal-kicker">NOTICE EXTRACTOR · STEP 2</div><h2 id="modalTitle">추출된 일정 ${currentExtracted.length}건을 확인해 주세요</h2><p class="modal-lead">날짜와 제목을 직접 수정할 수 있어요. 캘린더에 넣을 항목을 선택하세요.</p><div class="steps"><span class="step-chip done">✓ 공지 입력</span><i class="step-line"></i><span class="step-chip">2 일정 확인</span><i class="step-line"></i><span class="step-chip" style="background:#f6f7f9;color:#a0aab7">3 등록</span></div><div class="extracted-list">${cards}</div><div class="modal-actions"><button class="button button-secondary" id="backToNotice">이전</button><button class="button button-primary" id="continueSync">선택 일정 확인 <svg viewBox="0 0 20 20"><path d="M4 10h12m-5-5 5 5-5 5"/></svg></button></div>`, 'extracted');
    $$('.extract-check').forEach(el=>el.onchange=()=>currentExtracted[Number(el.dataset.index)].checked=el.checked);
    $$('.extract-title').forEach(el=>el.oninput=()=>currentExtracted[Number(el.dataset.index)].title=el.value);
    $$('.extract-date').forEach(el=>el.onchange=()=>{const [date,time]=el.value.split('T');currentExtracted[Number(el.dataset.index)].date=date;currentExtracted[Number(el.dataset.index)].time=time||'23:59';});
    $('#backToNotice').onclick=openImport;$('#continueSync').onclick=()=>{const selected=currentExtracted.filter(e=>e.checked);if(!selected.length){toast('캘린더에 등록할 일정을 하나 이상 선택해 주세요.');return;}const invalid=selected.some(e=>!e.title.trim());if(invalid){toast('일정 제목을 입력해 주세요.');return;}openConflict(selected);};
  }
  function openConflict(items){
    const conflict=items.find(e=>events.some(old=>old.date===e.date&&old.time===e.time));
    if(!conflict){finishSync(items,'both');return;}
    const old=events.find(e=>e.date===conflict.date&&e.time===conflict.time);
    modal(`<div class="modal-kicker">CALENDAR SYNC · CONFLICT FOUND</div><h2 id="modalTitle">기존 일정과 시간이 겹쳐요</h2><p class="modal-lead">두 일정이 같은 시간에 예정되어 있어요. 처리 방식을 선택해 주세요.</p><div class="conflict-box"><div class="conflict-title"><svg viewBox="0 0 20 20"><path d="M10 2.5 18 17H2L10 2.5Z"/><path d="M10 7v4m0 2.5h.01"/></svg>일정 시간 충돌</div><div class="conflict-compare"><div class="compare-event"><small>추가할 일정 · ${safe(conflict.course)}</small><strong>${safe(conflict.title)}</strong><span>${safe(conflict.date)} · ${safe(conflict.time)}</span></div><div class="compare-vs">VS</div><div class="compare-event"><small>기존 캘린더 일정</small><strong>${safe(old?.title||'개인 일정')}</strong><span>${safe(old?.date||conflict.date)} · ${safe(old?.time||conflict.time)}</span></div></div></div><div class="radio-options"><label class="radio-card"><input type="radio" name="conflictChoice" value="both" checked><span><strong>둘 다 유지 <small style="color:#25885f">추천</small></strong><small>기존 일정과 새 일정 모두 그대로 등록해요.</small></span></label><label class="radio-card"><input type="radio" name="conflictChoice" value="adjust"><span><strong>새 일정 시간 조정</strong><small>새 일정을 1시간 뒤로 옮겨 등록해요.</small></span></label><label class="radio-card"><input type="radio" name="conflictChoice" value="overwrite"><span><strong>기존 일정 덮어쓰기</strong><small>기존 일정을 새 공지 일정으로 바꿔요.</small></span></label></div><div class="modal-actions"><button class="button button-secondary" id="cancelConflict">취소</button><button class="button button-primary" id="resolveConflict">선택한 방식으로 등록</button></div>`, 'conflict');
    $('#cancelConflict').onclick=closeModal;$('#resolveConflict').onclick=()=>finishSync(items,$('input[name="conflictChoice"]:checked').value,old?.id);
  }
  function finishSync(items,choice,replaceId){
    let added=items.map(e=>({...e}));
    if(choice==='adjust'){added=added.map(e=>{if(events.some(old=>old.date===e.date&&old.time===e.time)){const [h,m]=e.time.split(':').map(Number);e.time=`${pad((h+1)%24)}:${pad(m)}`;e.endTime=e.time;}return e;});}
    if(choice==='overwrite')events=events.filter(old=>!items.some(item=>old.date===item.date&&old.time===item.time));
    events.push(...added);rerender();closeModal();
    downloadIcs(added);
    modal(`<div class="result-panel"><div class="result-mark">✓</div><div class="modal-kicker">SYNC COMPLETE</div><h2 id="modalTitle">일정 ${added.length}건을 준비했어요</h2><p>선택한 일정이 내 캘린더 목록에 추가되었어요.<br>캘린더 파일(.ics)도 함께 내려받았어요.</p><div class="result-stats"><div class="result-stat"><strong>${added.length}</strong><span>추가한 일정</span></div><div class="result-stat"><strong>${choice==='adjust'?'시간 조정':'충돌 확인'}</strong><span>처리 결과</span></div></div><div class="modal-actions" style="justify-content:center"><button class="button button-primary" id="doneSync">확인</button></div></div>`, 'done');$('#doneSync').onclick=closeModal;
  }
  function downloadIcs(items){
    const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Academic Sync//KR','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    items.forEach(e=>{const start=`${e.date.replaceAll('-','')}T${(e.time||'23:59').replace(':','')}00`;let end=e.endTime&&e.endTime!==e.time?`${e.date.replaceAll('-','')}T${e.endTime.replace(':','')}00`:new Date(dateObj(e.date).getTime()+86400000).toISOString().slice(0,10).replaceAll('-','')+'T000000';lines.push('BEGIN:VEVENT',`UID:${e.id}@academicsync.local`,`DTSTAMP:${stamp}`,`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${esc(e.title)}`,`DESCRIPTION:${esc(`${e.course} · ${e.source}`)}`,`LOCATION:${esc(e.place||'')}`,'END:VEVENT');});lines.push('END:VCALENDAR');const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='academic-sync-schedule.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function openEdit(id){const e=events.find(x=>x.id===id);if(!e)return;modal(`<div class="modal-kicker">EDIT SCHEDULE</div><h2 id="modalTitle">일정 수정</h2><p class="modal-lead">공지에서 추출한 일정의 제목과 일시를 고칠 수 있어요.</p><label class="input-label">일정명</label><input class="form-input" id="editTitle" maxlength="50" value="${safe(e.title)}"><label class="input-label">날짜와 시간</label><input class="form-input" id="editDate" type="datetime-local" value="${safe(e.date+'T'+e.time)}"><div class="modal-actions"><button class="button button-secondary" id="deleteEvent">삭제</button><button class="button button-secondary" id="cancelEdit">취소</button><button class="button button-primary" id="saveEdit">변경 저장</button></div>`,'edit');$('#cancelEdit').onclick=closeModal;$('#deleteEvent').onclick=()=>{events=events.filter(x=>x.id!==id);rerender();closeModal();toast('일정을 삭제했어요.');};$('#saveEdit').onclick=()=>{const title=$('#editTitle').value.trim(),value=$('#editDate').value;if(!title){toast('일정 제목을 입력해 주세요.');return;}const [date,time]=value.split('T');e.title=title;if(date)e.date=date;if(time)e.time=time;rerender();closeModal();toast('일정을 수정했어요.','success');};}
  function simpleModal(title,lead,body=''){modal(`<div class="modal-kicker">ACADEMIC SYNC</div><h2 id="modalTitle">${safe(title)}</h2><p class="modal-lead">${safe(lead)}</p>${body}<div class="modal-actions"><button class="button button-primary" id="simpleDone">확인</button></div>`,'simple');$('#simpleDone').onclick=closeModal;}
  function createCourse(){modal(`<div class="modal-kicker">MY COURSES</div><h2 id="modalTitle">수강 과목 추가</h2><p class="modal-lead">과목을 추가하면 일정 목록을 과목별로 모아볼 수 있어요.</p><label class="input-label">과목명</label><input class="form-input" id="courseName" placeholder="예: 알고리즘"><label class="input-label">과목 코드 <small>선택 입력</small></label><input class="form-input" id="courseCode" placeholder="예: CS305"><div class="modal-actions"><button class="button button-secondary" id="cancelCourse">취소</button><button class="button button-primary" id="saveCourse">과목 추가</button></div>`,'course');$('#cancelCourse').onclick=closeModal;$('#saveCourse').onclick=()=>{const name=$('#courseName').value.trim(),code=$('#courseCode').value.trim()||'NEW';if(!name){toast('과목명을 입력해 주세요.');return;}const row=document.createElement('button');row.className='course-item';row.dataset.course=name;row.innerHTML=`<span class="course-dot blue"></span><span>${safe(name)}</span><small>${safe(code)}</small>`;$('.course-list').appendChild(row);wireCourse(row);closeModal();toast(`${name} 과목을 추가했어요.`,'success');};}
  function wireCourse(button){button.addEventListener('click',()=>{const course=button.dataset.course;activeCourse=activeCourse===course?'':course;$$('.course-item').forEach(b=>b.classList.toggle('selected',b===button&&activeCourse));showAllEvents=true;renderAgenda();if(activeCourse)toast(`${activeCourse} 일정만 표시 중이에요.`);});}
  function toggleNav(view){const names={dashboard:'대시보드',calendar:'내 캘린더',notices:'공지 보관함'};$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#breadcrumbCurrent').textContent=names[view]||'대시보드';if(view==='calendar'){activeCourse='';showAllEvents=true;renderAgenda();document.querySelector('.agenda-column').scrollIntoView({behavior:'smooth'});}else if(view==='notices'){openImport();}else{showAllEvents=false;renderAgenda();}$('#sidebar').classList.remove('open');}

  $('#newNotice').onclick=openImport;$('#bannerImport').onclick=openImport;$('#modalClose').onclick=closeModal;$('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalBackdrop').hidden)closeModal();if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&modalStep==='import')parseNotice($('#noticeText').value);});
  $('#syncSelected').onclick=()=>{const selected=events.filter(e=>e.checked);if(!selected.length){toast('캘린더에 등록할 일정을 먼저 선택해 주세요.');return;}openConflict(selected);};
  $('#prevMonth').onclick=()=>{activeMonth=new Date(activeMonth.getFullYear(),activeMonth.getMonth()-1,1);renderCalendar();};$('#nextMonth').onclick=()=>{activeMonth=new Date(activeMonth.getFullYear(),activeMonth.getMonth()+1,1);renderCalendar();};
  $('#showAll').onclick=()=>{showAllEvents=!showAllEvents;$('#showAll').innerHTML=showAllEvents?'이번 주 일정만 보기 <svg viewBox="0 0 20 20"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>':'전체 일정 보기 <svg viewBox="0 0 20 20"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>';renderAgenda();};
  $$('.nav-item').forEach(b=>b.onclick=()=>toggleNav(b.dataset.view));$$('.course-item').forEach(wireCourse);
  $('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#calendarConnect').onclick=()=>simpleModal('캘린더 연결','Google Calendar가 연결된 데모 계정이에요. 실제 계정 연결은 OAuth 설정 후 사용할 수 있어요.','<div class="connected-account" style="padding:12px;border:1px solid #e8edf3;border-radius:8px"><span class="google-g">G</span><span><strong>Google Calendar · 연결됨</strong><small>minsu.kim@gmail.com</small></span></div>');$('#syncRefresh').onclick=()=>{const b=$('#syncRefresh');b.classList.add('spinning');setTimeout(()=>b.classList.remove('spinning'),750);toast('캘린더 동기화 상태가 최신이에요.','success');};$('#notifications').onclick=()=>simpleModal('모든 일정이 최신이에요','새로 확인할 공지나 일정 알림이 없습니다.');$('#profileButton').onclick=()=>simpleModal('김민수 · 내 프로필','컴퓨터공학과 3학년 · 2026학년도 2학기');$('#topProfile').onclick=()=>$('#profileButton').click();$('#addCourse').onclick=createCourse;$('#addCourseRow').onclick=createCourse;$('#manageCourses').onclick=()=>simpleModal('수강 과목 관리','현재 4개 과목을 일정에 연결해 관리하고 있어요. 과목을 눌러 해당 일정만 볼 수 있어요.');$('#filterButton').onclick=()=>{const types=['전체','과제','시험','퀴즈','팀플'];const body=`<div class="radio-options">${types.map((t,i)=>`<label class="radio-card"><input type="radio" name="filterType" value="${i===0?'all':Object.keys(typeLabel).find(k=>typeLabel[k]===t)}" ${i===0?'checked':''}><span><strong>${t}</strong><small>이번 주 일정 목록에 표시</small></span></label>`).join('')}</div>`;modal(`<div class="modal-kicker">SCHEDULE FILTER</div><h2 id="modalTitle">일정 종류 필터</h2><p class="modal-lead">보고 싶은 일정 종류를 선택하세요.</p>${body}<div class="modal-actions"><button class="button button-primary" id="applyFilter">필터 적용</button></div>`,'filter');$('#applyFilter').onclick=()=>{const type=$('input[name="filterType"]:checked').value;let list=events.filter(e=>!activeCourse||e.course===activeCourse).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));if(type!=='all')list=list.filter(e=>e.type===type);if(!showAllEvents)list=list.filter(e=>e.date>='2026-11-25').slice(0,5);const groups=new Map();list.forEach(e=>{if(!groups.has(e.date))groups.set(e.date,[]);groups.get(e.date).push(e);});$('#agendaList').innerHTML=list.length?[...groups.entries()].map(([date,items])=>{const d=dateObj(date);return `<section class="agenda-day"><div class="day-head"><span class="day-number">${d.getMonth()+1}월 ${d.getDate()}일</span><span class="day-name">${weekdays[d.getDay()]}요일</span><span class="day-count">${items.length}개 일정</span></div>${items.map(e=>`<article class="event-row ${e.completed?'completed':''}" data-id="${safe(e.id)}"><input class="event-check" type="checkbox" ${e.checked?'checked':''}><span class="event-edge ${safe(e.type)}"></span><div class="event-main"><div class="event-title-line"><span class="event-title">${safe(e.title)}</span><span class="event-tag ${safe(e.type)}">${typeLabel[e.type]}</span></div><div class="event-meta"><span class="course-name">${safe(e.course)}</span><i class="meta-dot"></i><span>${safe(e.place||'')}</span></div></div><div class="event-time"><strong>${safe(e.time)}</strong><small>${safe(e.source||'공지에서 추출')}</small></div></article>`).join('')}</section>`;}).join(''):'<div style="padding:30px;text-align:center;color:#98a3b1;font-size:10px">해당 종류의 일정이 없어요.</div>';closeModal();};};
  $$('.segment').forEach(button=>button.onclick=()=>{$$('.segment').forEach(b=>b.classList.toggle('active',b===button));if(button.dataset.agendaView==='week')toast('주간 보기를 목록으로 정리했어요.');else toast('일정 목록으로 전환했어요.');});
  document.addEventListener('click',e=>{if(window.innerWidth<=640&&$('#sidebar').classList.contains('open')&&!$('#sidebar').contains(e.target)&&!$('#mobileMenu').contains(e.target))$('#sidebar').classList.remove('open');});
  rerender();
})();
