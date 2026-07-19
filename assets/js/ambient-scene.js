(function(){
  try{
    var h=new Date().getHours();
    var tod = (h>=6&&h<17)?"tod-day":(h>=17&&h<20)?"tod-dusk":"tod-night";
    document.body.classList.add(tod);
    var stars=document.getElementById("fsStars");
    if(stars && !stars.dataset.ready){
      stars.dataset.ready="1";
      var out="";
      for(var i=0;i<46;i++){
        var x=(rnd()*1440).toFixed(0), y=(rnd()*420).toFixed(0),
            r=(rnd()*1.2+.5).toFixed(2), d=(rnd()*3).toFixed(2);
        out+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" style="animation-delay:'+d+'s"/>';
      }
      stars.innerHTML=out;
    }
    var csvg=document.querySelector("#cauldron svg");
    if(csvg && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      var NS="http://www.w3.org/2000/svg";
      for(var j=0;j<4;j++){
        var b=document.createElementNS(NS,"circle");
        b.setAttribute("class","cld-bubble");
        b.setAttribute("cx",String(58+j*12)); b.setAttribute("cy","55"); b.setAttribute("r","0");
        var ar=document.createElementNS(NS,"animate");
        ar.setAttribute("attributeName","r"); ar.setAttribute("values","0;2.6;0");
        ar.setAttribute("dur",(2.2+j*.5)+"s"); ar.setAttribute("begin",(j*.7)+"s");
        ar.setAttribute("repeatCount","indefinite");
        var ao=document.createElementNS(NS,"animate");
        ao.setAttribute("attributeName","opacity"); ao.setAttribute("values","0;.8;0");
        ao.setAttribute("dur",(2.2+j*.5)+"s"); ao.setAttribute("begin",(j*.7)+"s");
        ao.setAttribute("repeatCount","indefinite");
        b.appendChild(ar); b.appendChild(ao); csvg.appendChild(b);
      }
    }
  }catch(e){console.warn("avalon-scene",e);}
})();
