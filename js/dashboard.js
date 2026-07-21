const Dashboard={render(){
  const info=Schedule.getDay();
  shiftBadge.textContent=(info.rawType||info.type).toUpperCase();
  scheduleCard.innerHTML=Schedule.buildSchedule(info).map(r=>`<div class="schedule-row"><time>${r[0]}</time><span>${r[1]}</span></div>`).join("");
  Checklist.render();
  const s=Utils.record("sleep"),n=Utils.record("nutrition"),w=Utils.record("workout"),h=Utils.record("health");
  quickSleep.textContent=s?`${Utils.hours(s.start,s.end).toFixed(1)} hours`:"Not logged";
  quickNutrition.textContent=n?`${n.protein||0}g protein · ${n.water||0} oz`:"Not logged";
  quickWorkout.textContent=w?.complete?"Completed":"Not completed";
  quickWeight.textContent=h?.weight?`${h.weight} lb`:"No weight";
  const score=Readiness.score();
  readinessScore.textContent=score;scoreRingValue.textContent=score;
  readinessText.textContent=info.type==="off"?"Recovery day. Readiness reflects general wellness.":score>=85?"Strong readiness for tonight.":score>=70?"Good, with room to improve.":score>=50?"Moderate readiness. Protect recovery.":"More data or recovery is needed.";
  scoreRing.style.borderColor=score>=85?"#77d7b1":score>=70?"#62b5ff":score>=50?"#f4c96b":"#ff7373";
  Medications.renderDue();
}};