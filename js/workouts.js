const Workouts={
  program:null,programSource:'built-in',timer:null,timerRemaining:0,
  async init(){
    try{
      const custom=localStorage.getItem('routineWorkoutProgram');
      if(custom){
        const parsed=JSON.parse(custom);
        this.program=this.normalizeProgram(parsed);
        this.programSource='imported';
      }else{
        await this.loadBundledProgram();
      }
    }catch(e){
      console.error('Program load failed',e);
      localStorage.removeItem('routineWorkoutProgram');
      await this.loadBundledProgram();
    }
    this.render();
  },
  async loadBundledProgram(){
    const r=await fetch('data/maps-anabolic.json');
    if(!r.ok)throw new Error('Bundled workout program could not be loaded.');
    const j=await r.json();
    this.program=this.normalizeProgram(j);
    this.programSource='built-in';
  },
  normalizeProgram(input){
    const p=input?.program||input;
    if(!p||typeof p!=='object')throw new Error('The JSON does not contain a workout program.');
    if(!String(p.name||'').trim())throw new Error('The workout program needs a name.');
    if(!Array.isArray(p.phases)||!p.phases.length)throw new Error('The workout program needs at least one phase.');
    p.phases.forEach((phase,phaseIndex)=>{
      if(!Array.isArray(phase.weeks)||!phase.weeks.length)throw new Error(`Phase ${phaseIndex+1} needs a weeks array.`);
      if(!Array.isArray(phase.workouts)||!phase.workouts.length)throw new Error(`Phase ${phaseIndex+1} needs at least one workout.`);
      phase.workouts.forEach((workout,workoutIndex)=>{
        if(!Array.isArray(workout.exercises)||!workout.exercises.length)throw new Error(`Workout ${workoutIndex+1} in phase ${phaseIndex+1} needs exercises.`);
        workout.day=workout.day??workoutIndex+1;
        workout.id=workout.id||`phase_${phaseIndex+1}_workout_${workoutIndex+1}`;
        workout.name=workout.name||`Workout ${workout.day}`;
        workout.exercises.forEach((exercise,exerciseIndex)=>{
          if(!String(exercise.name||'').trim())throw new Error(`Exercise ${exerciseIndex+1} is missing a name.`);
          exercise.order=exercise.order??exerciseIndex+1;
          exercise.sets=exercise.sets??1;
          exercise.reps=exercise.reps??'';
        });
      });
      phase.id=phase.id||`phase_${phaseIndex+1}`;
      phase.name=phase.name||`Phase ${phaseIndex+1}`;
      phase.set_rep_guidance=phase.set_rep_guidance||{};
    });
    p.duration_weeks=Number(p.duration_weeks)||Math.max(...p.phases.flatMap(x=>x.weeks.map(Number)));
    return p;
  },
  maxWeek(){return Number(this.program?.duration_weeks)||Math.max(1,...(this.program?.phases||[]).flatMap(p=>p.weeks.map(Number)))},
  async importProgram(event){
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      const program=this.normalizeProgram(parsed);
      const message=`Import "${program.name}"?\n\nYour current workout position and unfinished workout will reset. Completed workout history will remain.`;
      if(!confirm(message))return;
      localStorage.setItem('routineWorkoutProgram',JSON.stringify(program));
      this.program=program;
      this.programSource='imported';
      this.saveState({week:Math.min(...program.phases.flatMap(p=>p.weeks.map(Number))),workoutIndex:0,active:null});
      this.skipTimer();
      this.render();
      Dashboard.render();
      alert(`${program.name} is now active.`);
    }catch(error){
      console.error(error);
      alert(`Program could not be imported. ${error.message||'Check the JSON format.'}`);
    }
  },
  exportProgram(){
    if(!this.program)return alert('No workout program is loaded.');
    const safe=String(this.program.name||'workout-program').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const blob=new Blob([JSON.stringify({program:this.program},null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${safe||'workout-program'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  async restoreBundledProgram(){
    if(this.programSource==='built-in')return alert('MAPS Anabolic is already active.');
    if(!confirm('Restore the bundled MAPS Anabolic program? Current program position will reset. Workout history will remain.'))return;
    localStorage.removeItem('routineWorkoutProgram');
    await this.loadBundledProgram();
    this.saveState({week:Math.min(...this.program.phases.flatMap(p=>p.weeks.map(Number))),workoutIndex:0,active:null});
    this.skipTimer();
    this.render();
    Dashboard.render();
  },
  state(){return JSON.parse(localStorage.getItem('routineWorkoutState')||'null')||{week:1,workoutIndex:0,active:null}},
  saveState(s){localStorage.setItem('routineWorkoutState',JSON.stringify(s))},
  currentPhase(week=this.state().week){return this.program?.phases?.find(p=>p.weeks.includes(Number(week)))||null},
  currentWorkout(){const s=this.state(),p=this.currentPhase();if(!p?.workouts?.length)return null;return p.workouts[Math.min(s.workoutIndex,p.workouts.length-1)]},
  todayCompleted(){return App.records.some(r=>r.type==='workoutSession'&&r.date===Utils.today()&&r.complete)},
  setWeek(v){const s=this.state();s.week=Number(v);s.workoutIndex=0;s.active=null;this.saveState(s);this.render();Dashboard.render()},
  setWorkout(v){const s=this.state();s.workoutIndex=Number(v);s.active=null;this.saveState(s);this.render();Dashboard.render()},
  resetProgram(){if(!confirm('Reset workout week and active workout? Workout history will remain.'))return;this.saveState({week:1,workoutIndex:0,active:null});this.render();Dashboard.render()},
  start(){const s=this.state(),w=this.currentWorkout(),p=this.currentPhase();if(!w)return;const exercises=w.exercises.map((e,ei)=>({name:e.name,targetSets:e.sets,targetReps:e.reps||`${e.duration_seconds||''} sec`,superset:e.superset_group||'',sets:Array.from({length:this.setCount(e.sets)},(_,i)=>({set:i+1,weight:'',reps:'',done:false}))}));s.active={id:crypto.randomUUID(),startedAt:new Date().toISOString(),week:s.week,phaseId:p.id,phaseName:p.name,workoutId:w.id,workoutName:w.name,day:w.day,restSeconds:Number(p.set_rep_guidance?.rest_between_sets_seconds||90),exercises};this.saveState(s);this.render()},
  setCount(v){if(typeof v==='number')return v;const m=String(v).match(/\d+/g);return m?Number(m[m.length-1]):1},
  updateSet(ei,si,field,value){const s=this.state();if(!s.active)return;s.active.exercises[ei].sets[si][field]=field==='done'?Boolean(value):value;this.saveState(s);if(field==='done'&&value)this.startTimer(s.active.restSeconds);this.renderActiveStats()},
  startTimer(seconds){clearInterval(this.timer);this.timerRemaining=Number(seconds)||90;this.paintTimer();this.timer=setInterval(()=>{this.timerRemaining--;this.paintTimer();if(this.timerRemaining<=0){clearInterval(this.timer);if('vibrate'in navigator)navigator.vibrate([150,80,150])}},1000)},
  paintTimer(){const el=document.getElementById('restTimerValue');if(el)el.textContent=`${Math.floor(this.timerRemaining/60)}:${String(this.timerRemaining%60).padStart(2,'0')}`},
  skipTimer(){clearInterval(this.timer);this.timerRemaining=0;this.paintTimer()},
  volume(active=this.state().active){if(!active)return 0;return active.exercises.reduce((sum,e)=>sum+e.sets.filter(s=>s.done).reduce((a,s)=>a+(Number(s.weight)||0)*(Number(s.reps)||0),0),0)},
  completedSets(active=this.state().active){return active?active.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0):0},
  totalSets(active=this.state().active){return active?active.exercises.reduce((n,e)=>n+e.sets.length,0):0},
  renderActiveStats(){const s=this.state();if(!s.active)return;const done=this.completedSets(s.active),total=this.totalSets(s.active),pct=total?Math.round(done/total*100):0;const bar=document.getElementById('activeProgress');if(bar)bar.style.width=pct+'%';const vol=document.getElementById('activeVolume');if(vol)vol.textContent=this.volume(s.active).toLocaleString();const sets=document.getElementById('activeSets');if(sets)sets.textContent=`${done}/${total}`},
  async finish(){const s=this.state(),a=s.active;if(!a)return;const endedAt=new Date().toISOString(),minutes=Math.max(1,Math.round((new Date(endedAt)-new Date(a.startedAt))/60000));await Database.put({id:'workout-session-'+a.id,type:'workoutSession',date:Utils.today(),complete:true,startedAt:a.startedAt,endedAt,minutes,week:a.week,phaseName:a.phaseName,workoutId:a.workoutId,workoutName:a.workoutName,day:a.day,volume:this.volume(a),completedSets:this.completedSets(a),exercises:a.exercises});const phase=this.currentPhase(a.week);if(phase){s.workoutIndex++;if(s.workoutIndex>=phase.workouts.length){s.workoutIndex=0;s.week=Math.min(this.maxWeek(),Number(s.week)+1)}}s.active=null;this.saveState(s);await App.refresh();Navigation.showPage('fitness')},
  cancel(){if(!confirm('End this workout without saving it?'))return;const s=this.state();s.active=null;this.saveState(s);this.skipTimer();this.render()},
  render(){if(!this.program)return;const s=this.state(),p=this.currentPhase(),w=this.currentWorkout();if(programWeek){programWeek.innerHTML=Array.from({length:this.maxWeek()},(_,i)=>`<option value="${i+1}" ${s.week===i+1?'selected':''}>Week ${i+1}</option>`).join('')}if(programWorkout&&p){programWorkout.innerHTML=p.workouts.map((x,i)=>`<option value="${i}" ${s.workoutIndex===i?'selected':''}>Workout ${x.day}</option>`).join('')}
    if(s.active){workoutProgramHome.classList.add('hidden');activeWorkout.classList.remove('hidden');this.renderActive(s.active)}else{activeWorkout.classList.add('hidden');workoutProgramHome.classList.remove('hidden');workoutProgramHome.innerHTML=this.homeMarkup(p,w,s)}
    this.renderProgramManager();
    this.renderHistory();
  },
  renderProgramManager(){
    const name=document.getElementById('activeProgramName');
    const source=document.getElementById('activeProgramSource');
    const details=document.getElementById('activeProgramDetails');
    if(name)name.textContent=this.program?.name||'No program loaded';
    if(source)source.textContent=this.programSource==='imported'?'IMPORTED':'BUILT IN';
    if(details){
      const phases=this.program?.phases?.length||0;
      details.textContent=`${this.maxWeek()} weeks · ${phases} phase${phases===1?'':'s'}`;
    }
  },
  homeMarkup(p,w,s){if(!p||!w)return '<div class="card"><p class="muted">Workout program unavailable.</p></div>';const total=p.workouts.length;return `<div class="hero-card workout-hero"><p class="eyebrow">${this.program.name}</p><h2 class="program-title">${p.name}</h2><p class="phase-title">Week ${s.week} · Workout ${w.day} of ${total}</p><div class="workout-meta"><span class="pill">${w.exercises.length} exercises</span><span class="pill">${p.set_rep_guidance?.rest_between_sets_seconds||90}s rest</span><span class="pill good">Ready</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.round((s.week-1)/Math.max(1,this.maxWeek()-1)*100)}%"></div></div><button class="primary wide" onclick="Workouts.start()">Begin workout</button></div><div class="card"><div class="section-head inside"><h2>Today's workout</h2><span class="badge">Workout ${w.day}</span></div><div class="mini-list">${w.exercises.map((e,i)=>`<div class="mini-row"><span><strong>${i+1}. ${e.name}</strong><small class="muted" style="display:block;margin-top:4px">${e.sets} sets · ${e.reps||e.duration_seconds+' sec'}${e.superset_group?' · Superset '+e.superset_group:''}</small></span></div>`).join('')}</div></div>`},
  renderActive(a){activeWorkout.innerHTML=`<div class="timer-bar"><div><p class="eyebrow">Rest timer</p><span class="timer-value" id="restTimerValue">0:00</span></div><button class="ghost" onclick="Workouts.skipTimer()">Skip</button></div><div class="hero-card workout-hero"><p class="eyebrow">${a.phaseName}</p><h2 class="program-title">Workout ${a.day}</h2><div class="workout-summary"><div class="stat"><strong id="activeSets">${this.completedSets(a)}/${this.totalSets(a)}</strong><small>Sets</small></div><div class="stat"><strong id="activeVolume">${this.volume(a).toLocaleString()}</strong><small>Volume</small></div><div class="stat"><strong>${a.exercises.length}</strong><small>Exercises</small></div></div><div class="progress-track" style="margin-top:15px"><div id="activeProgress" class="progress-fill" style="width:${Math.round(this.completedSets(a)/this.totalSets(a)*100)||0}%"></div></div></div>${a.exercises.map((e,ei)=>`<div class="exercise-card">${e.superset?`<div class="superset-banner">Superset ${e.superset}</div>`:''}<h3>${ei+1}. ${e.name}</h3><div class="target">Target: ${e.targetSets} sets × ${e.targetReps}</div><div class="set-grid"><span class="set-label">SET</span><span class="set-label">WEIGHT</span><span class="set-label">REPS</span><span class="set-label">DONE</span>${e.sets.map((set,si)=>`<strong>${si+1}</strong><input type="number" inputmode="decimal" value="${set.weight}" placeholder="lb" onchange="Workouts.updateSet(${ei},${si},'weight',this.value)"><input type="number" inputmode="numeric" value="${set.reps}" placeholder="reps" onchange="Workouts.updateSet(${ei},${si},'reps',this.value)"><input class="set-check" type="checkbox" ${set.done?'checked':''} onchange="Workouts.updateSet(${ei},${si},'done',this.checked)">`).join('')}</div></div>`).join('')}<div class="workout-actions"><button class="ghost" onclick="Workouts.cancel()">Cancel</button><button class="primary" onclick="Workouts.finish()">Finish workout</button></div>`;this.paintTimer()},
  renderHistory(){if(!workoutHistory)return;const rows=App.records.filter(r=>r.type==='workoutSession').sort((a,b)=>(b.endedAt||'').localeCompare(a.endedAt||'')).slice(0,8);workoutHistory.innerHTML=rows.length?rows.map(r=>`<div class="history-row"><span><strong>${r.phaseName} · Workout ${r.day}</strong><small class="muted" style="display:block">${Utils.formatDate(r.date)} · ${r.minutes} min</small></span><span>${Number(r.volume||0).toLocaleString()} lb</span></div>`).join(''):'<p class="muted">Complete your first workout to begin your history.</p>'}
};
