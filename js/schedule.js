const Schedule={
  days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  defaultWeekly(){
    return {
      0:{type:"off",start:"",end:""},
      1:{type:"off",start:"",end:""},
      2:{type:"work",start:"20:00",end:"06:00"},
      3:{type:"work",start:"20:00",end:"06:00"},
      4:{type:"work",start:"20:00",end:"06:00"},
      5:{type:"work",start:"20:00",end:"06:00"},
      6:{type:"off",start:"",end:""}
    };
  },
  defaultRoutine(){
    return {
      workSleepStart:"08:00",
      workWakeTime:"14:30",
      offBedTime:"03:30",
      offWakeTime:"11:30",
      workoutTime:"15:30",
      caffeineCutoff:"02:00",
      commuteMinutes:30,
      sleepTargetHours:7
    };
  },
  loadSettings(){
    return JSON.parse(localStorage.getItem("scheduleSettings")||"null")||{
      weekly:this.defaultWeekly(),
      routine:this.defaultRoutine(),
      temporary:null
    };
  },
  saveSettings(settings){
    localStorage.setItem("scheduleSettings",JSON.stringify(settings));
  },
  renderEditors(){
    const settings=this.loadSettings();
    const weekly=document.getElementById("weeklyScheduleEditor");
    const temp=document.getElementById("temporaryScheduleEditor");
    if(weekly) weekly.innerHTML=this.editorRows(settings.weekly,"weekly");
    if(temp) temp.innerHTML=this.editorRows(settings.temporary?.weekly||settings.weekly,"temporary");
    const r=settings.routine;
    if(document.getElementById("workSleepStart")){
      workSleepStart.value=r.workSleepStart||"";
      workWakeTime.value=r.workWakeTime||"";
      offBedTime.value=r.offBedTime||"";
      offWakeTime.value=r.offWakeTime||"";
      defaultWorkoutTime.value=r.workoutTime||"";
      defaultCaffeineCutoff.value=r.caffeineCutoff||"";
      commuteMinutes.value=r.commuteMinutes??30;
      sleepTargetHours.value=r.sleepTargetHours??7;
      temporaryStartDate.value=settings.temporary?.startDate||"";
      temporaryEndDate.value=settings.temporary?.endDate||"";
    }
    this.renderOverrides();
  },
  editorRows(schedule,prefix){
    return this.days.map((day,i)=>{
      const d=schedule?.[i]||{type:"off",start:"",end:""};
      return `<div class="schedule-day-editor">
        <strong>${day.slice(0,3)}</strong>
        <label>Status
          <select id="${prefix}Type${i}">
            ${["work","off","training","overtime","holiday"].map(x=>`<option value="${x}" ${d.type===x?"selected":""}>${x[0].toUpperCase()+x.slice(1)}</option>`).join("")}
          </select>
        </label>
        <label>Start<input id="${prefix}Start${i}" type="time" value="${d.start||""}"></label>
        <label>End<input id="${prefix}End${i}" type="time" value="${d.end||""}"></label>
      </div>`;
    }).join("");
  },
  collect(prefix){
    const out={};
    this.days.forEach((_,i)=>{
      out[i]={
        type:document.getElementById(`${prefix}Type${i}`).value,
        start:document.getElementById(`${prefix}Start${i}`).value,
        end:document.getElementById(`${prefix}End${i}`).value
      };
    });
    return out;
  },
  async saveWeekly(){
    const settings=this.loadSettings();
    settings.weekly=this.collect("weekly");
    this.saveSettings(settings);
    await App.refresh();
    alert("Weekly schedule saved.");
  },
  async saveRoutine(){
    const settings=this.loadSettings();
    settings.routine={
      workSleepStart:workSleepStart.value,
      workWakeTime:workWakeTime.value,
      offBedTime:offBedTime.value,
      offWakeTime:offWakeTime.value,
      workoutTime:defaultWorkoutTime.value,
      caffeineCutoff:defaultCaffeineCutoff.value,
      commuteMinutes:Number(commuteMinutes.value||0),
      sleepTargetHours:Number(sleepTargetHours.value||7)
    };
    this.saveSettings(settings);
    await App.refresh();
    alert("Routine settings saved.");
  },
  async addOverride(){
    const start=overrideStartDate.value;
    const end=overrideEndDate.value||start;
    if(!start) return alert("Choose a start date.");
    if(end<start) return alert("End date cannot be before the start date.");
    await Database.put({
      id:"schedule-override-"+crypto.randomUUID(),
      type:"scheduleOverride",
      date:start,
      startDate:start,
      endDate:end,
      overrideType:overrideType.value,
      label:overrideLabel.value.trim(),
      shiftStart:overrideShiftStart.value,
      shiftEnd:overrideShiftEnd.value,
      notes:overrideNotes.value.trim()
    });
    overrideLabel.value="";
    overrideNotes.value="";
    await App.refresh();
  },
  async removeOverride(id){
    await Database.remove(id);
    await App.refresh();
  },
  renderOverrides(){
    const el=document.getElementById("scheduleOverrideList");
    if(!el) return;
    const rows=App.records.filter(r=>r.type==="scheduleOverride")
      .sort((a,b)=>a.startDate.localeCompare(b.startDate));
    el.innerHTML=rows.length?rows.map(r=>`<div class="med-row">
      <div>
        <span class="override-type">${r.overrideType}</span>
        <strong>${r.label||this.labelForType(r.overrideType)}</strong>
        <div class="muted">${Utils.formatDate(r.startDate)}${r.endDate&&r.endDate!==r.startDate?`–${Utils.formatDate(r.endDate)}`:""}${r.shiftStart?` · ${this.formatTime(r.shiftStart)}–${this.formatTime(r.shiftEnd)}`:""}</div>
        ${r.notes?`<div class="muted">${r.notes}</div>`:""}
      </div>
      <div class="override-actions"><button class="ghost" onclick="Schedule.removeOverride('${r.id}')">Delete</button></div>
    </div>`).join(""):`<p class="muted">No schedule exceptions added.</p>`;
  },
  async saveTemporary(){
    if(!temporaryStartDate.value||!temporaryEndDate.value) return alert("Choose both dates.");
    if(temporaryEndDate.value<temporaryStartDate.value) return alert("End date cannot be before start date.");
    const settings=this.loadSettings();
    settings.temporary={
      startDate:temporaryStartDate.value,
      endDate:temporaryEndDate.value,
      weekly:this.collect("temporary")
    };
    this.saveSettings(settings);
    await App.refresh();
    alert("Temporary schedule saved.");
  },
  async clearTemporary(){
    const settings=this.loadSettings();
    settings.temporary=null;
    this.saveSettings(settings);
    await App.refresh();
    this.renderEditors();
  },
  getDay(dateString=Utils.today()){
    const date=new Date(dateString+"T12:00:00");
    const settings=this.loadSettings();
    const override=App.records.find(r=>r.type==="scheduleOverride"&&dateString>=r.startDate&&dateString<=r.endDate);
    if(override){
      const status=["vacation","sick","holiday","off"].includes(override.overrideType)?"off":override.overrideType;
      return {
        source:"override",
        type:status,
        label:override.label||this.labelForType(override.overrideType),
        start:override.shiftStart||"",
        end:override.shiftEnd||"",
        notes:override.notes||"",
        rawType:override.overrideType
      };
    }
    if(settings.temporary&&dateString>=settings.temporary.startDate&&dateString<=settings.temporary.endDate){
      const day=settings.temporary.weekly[date.getDay()];
      return {...day,source:"temporary",label:this.labelForType(day.type)};
    }
    const day=settings.weekly[date.getDay()]||{type:"off",start:"",end:""};
    return {...day,source:"weekly",label:this.labelForType(day.type)};
  },
  labelForType(type){
    return ({work:"Work Night",off:"Off Day",vacation:"Vacation Day",sick:"Sick Day",training:"Training Day",overtime:"Overtime Shift",holiday:"Holiday",custom:"Custom Shift"})[type]||"Schedule";
  },
  formatTime(t){
    if(!t) return "";
    const [h,m]=t.split(":").map(Number);
    return new Date(2000,0,1,h,m).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
  },
  buildSchedule(dayInfo){
    const r=this.loadSettings().routine;
    if(dayInfo.rawType==="vacation") return [
      ["All day",dayInfo.label||"Vacation"],
      ["Recovery","No work preparation required"],
      ["Flexible","Protect sleep while enjoying time away"]
    ];
    if(dayInfo.rawType==="sick") return [
      ["All day","Sick day"],
      ["Priority","Rest, hydration, nutrition and recovery"],
      ["Work","No shift scheduled"]
    ];
    if(dayInfo.type==="off") return [
      [this.formatTime(r.offBedTime),"Target bedtime"],
      [this.formatTime(r.offWakeTime),"Target wake time"],
      [this.formatTime(r.workoutTime),"Workout, walk or family activity"],
      ["Evening","Meal preparation and next-day planning"]
    ];
    const commute=Number(r.commuteMinutes||0);
    const shiftStart=dayInfo.start||"20:00";
    const sleepStart=r.workSleepStart||"08:00";
    const wake=r.workWakeTime||"14:30";
    return [
      [this.formatTime(sleepStart),"Primary sleep block begins"],
      [this.formatTime(wake),"Wake, water and light exposure"],
      [this.formatTime(r.workoutTime),"Workout or recovery"],
      [this.formatTime(shiftStart),dayInfo.label||"Shift begins"],
      [this.formatTime(r.caffeineCutoff),"Caffeine cutoff"],
      [dayInfo.end?this.formatTime(dayInfo.end):"6:00 AM","Shift ends"],
      ["Commute",`${commute} minutes each way`]
    ];
  }
};