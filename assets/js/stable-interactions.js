(function(){
  "use strict";
  document.addEventListener("click", function(event){
    const button=event.target.closest("button.sit-btn, button.chip, button.spread-btn");
    if(!button || button.disabled || button.getAttribute("aria-disabled")==="true") return;
    const group=button.closest(".sit-grid,.filters,.spread-grid,.pakli-row,.random-choices,.dk-target-grid");
    if(!group) return;
    if(button.classList.contains("chip") && group.id==="lexFilters") return;
    group.querySelectorAll("button.on").forEach(function(el){ if(el!==button) el.classList.remove("on"); });
    button.classList.add("on");
    button.setAttribute("aria-pressed","true");
    group.querySelectorAll("button:not(.on)[aria-pressed]").forEach(function(el){el.setAttribute("aria-pressed","false");});
  }, true);
})();
