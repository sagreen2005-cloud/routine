const Backup={
  object(){
    return{
      app:"Routine",
      version:3,
      exportedAt:new Date().toISOString(),
      records:App.records,
      settings:{
        pin:localStorage.getItem("shiftCommandPin"),
        scheduleSettings:localStorage.getItem("scheduleSettings"),
        workoutProgram:localStorage.getItem("routineWorkoutProgram"),
        workoutState:localStorage.getItem("routineWorkoutState")
      }
    }
  },
  async share(){
    const file=new File([JSON.stringify(this.object(),null,2)],`routine-backup-${Utils.today()}.json`,{type:"application/json"});
    if(navigator.canShare?.({files:[file]})){
      await navigator.share({title:"Routine Backup",files:[file]});
      backupStatus.textContent="Choose Google Drive in the Share Sheet.";
    }else this.download()
  },
  download(){
    const b=new Blob([JSON.stringify(this.object(),null,2)],{type:"application/json"}),a=document.createElement("a");
    a.href=URL.createObjectURL(b);
    a.download=`routine-backup-${Utils.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    backupStatus.textContent="Backup file created."
  },
  async restore(e){
    const f=e.target.files[0];
    if(!f)return;
    try{
      const b=JSON.parse(await f.text());
      if(!Array.isArray(b.records))return alert("Invalid backup.");
      await Database.clear();
      for(const r of b.records)await Database.put(r);
      const set=(key,value)=>value?localStorage.setItem(key,value):localStorage.removeItem(key);
      set("shiftCommandPin",b.settings?.pin);
      set("scheduleSettings",b.settings?.scheduleSettings);
      set("routineWorkoutProgram",b.settings?.workoutProgram);
      set("routineWorkoutState",b.settings?.workoutState);
      backupStatus.textContent="Backup restored. Reloading Routine…";
      setTimeout(()=>location.reload(),500);
    }catch(error){
      alert("Backup could not be restored.");
    }
  }
};